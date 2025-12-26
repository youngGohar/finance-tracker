// ========================================
// GOOGLE SHEETS SYNC MODULE
// ========================================
// All Google Sheets API interactions

class GoogleSheetsSync {
    constructor() {
        this.isReady = false;
        this.isSignedIn = false;
        this.user = null;
        this.spreadsheetId = null;
    }

    // Initialize Google API
    async init() {
        return new Promise((resolve, reject) => {
            window.gapi.load('client:auth2', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: GOOGLE_CONFIG.API_KEY,
                        clientId: GOOGLE_CONFIG.CLIENT_ID,
                        discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
                        scope: GOOGLE_CONFIG.SCOPES
                    });

                    this.isReady = true;
                    const authInstance = window.gapi.auth2.getAuthInstance();
                    
                    // Check if already signed in
                    if (authInstance.isSignedIn.get()) {
                        await this.handleSignIn(authInstance.currentUser.get());
                    }

                    // Listen for sign-in state changes
                    authInstance.isSignedIn.listen(isSignedIn => {
                        if (isSignedIn) {
                            this.handleSignIn(authInstance.currentUser.get());
                        } else {
                            this.handleSignOut();
                        }
                    });

                    resolve();
                } catch (error) {
                    console.error('Error initializing Google API:', error);
                    reject(error);
                }
            });
        });
    }

    // Sign in
    async signIn() {
        if (!this.isReady) {
            throw new Error('Google API not ready');
        }
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signIn();
    }

    // Sign out
    async signOut() {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.handleSignOut();
    }

    // Handle successful sign-in
    async handleSignIn(googleUser) {
        const profile = googleUser.getBasicProfile();
        this.user = {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl()
        };
        this.isSignedIn = true;

        // Get or create spreadsheet
        const savedSheetId = localStorage.getItem(`spreadsheet_${this.user.id}`);
        if (savedSheetId) {
            this.spreadsheetId = savedSheetId;
        } else {
            await this.createSpreadsheet();
        }
    }

    // Handle sign-out
    handleSignOut() {
        this.isSignedIn = false;
        this.user = null;
        this.spreadsheetId = null;
    }

    // Create new spreadsheet
    async createSpreadsheet() {
        try {
            const response = await window.gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: `Finance Tracker - ${this.user.name}`
                },
                sheets: [
                    { properties: { title: 'Transactions' } },
                    { properties: { title: 'Incomes' } },
                    { properties: { title: 'Subscriptions' } },
                    { properties: { title: 'Investments' } },
                    { properties: { title: 'Goals' } },
                    { properties: { title: 'Donations' } }
                ]
            });

            this.spreadsheetId = response.result.spreadsheetId;
            localStorage.setItem(`spreadsheet_${this.user.id}`, this.spreadsheetId);

            // Initialize headers
            await this.initializeHeaders();
            
            return this.spreadsheetId;
        } catch (error) {
            console.error('Error creating spreadsheet:', error);
            throw error;
        }
    }

    // Initialize sheet headers
    async initializeHeaders() {
        const updates = [
            {
                range: 'Transactions!A1:G1',
                values: [['ID', 'Type', 'Title', 'Amount', 'Category', 'Date', 'Notes']]
            },
            {
                range: 'Incomes!A1:F1',
                values: [['ID', 'Title', 'Amount', 'Currency', 'Date', 'Recurring']]
            },
            {
                range: 'Subscriptions!A1:E1',
                values: [['ID', 'Name', 'Amount', 'Billing Date', 'Category']]
            },
            {
                range: 'Investments!A1:F1',
                values: [['ID', 'Type', 'Name', 'Quantity', 'Purchase Price', 'Current Value']]
            },
            {
                range: 'Goals!A1:F1',
                values: [['ID', 'Name', 'Target Amount', 'Current Amount', 'Deadline', 'Monthly Savings']]
            },
            {
                range: 'Donations!A1:E1',
                values: [['ID', 'Organization', 'Amount', 'Date', 'Recurring']]
            }
        ];

        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: { data: updates, valueInputOption: 'RAW' }
        });
    }

    // Sync data to sheets
    async syncToSheets(data) {
        if (!this.spreadsheetId) {
            throw new Error('No spreadsheet ID');
        }

        try {
            const updates = [
                {
                    range: 'Transactions!A2:G',
                    values: data.transactions.map(t => [
                        t.id, t.type, t.title, t.amount, t.category || '', t.date, t.notes || ''
                    ])
                },
                {
                    range: 'Incomes!A2:F',
                    values: data.incomes.map(i => [
                        i.id, i.title, i.amount, i.currency, i.date, i.recurring ? 'YES' : 'NO'
                    ])
                },
                {
                    range: 'Subscriptions!A2:E',
                    values: data.subscriptions.map(s => [
                        s.id, s.name, s.amount, s.billingDate, s.category || ''
                    ])
                },
                {
                    range: 'Investments!A2:F',
                    values: data.investments.map(i => [
                        i.id, i.type, i.name, i.quantity, i.purchasePrice, i.currentValue || ''
                    ])
                },
                {
                    range: 'Goals!A2:F',
                    values: data.goals.map(g => [
                        g.id, g.name, g.targetAmount, g.currentAmount, g.deadline || '', g.monthlySavings || ''
                    ])
                },
                {
                    range: 'Donations!A2:E',
                    values: data.donations.map(d => [
                        d.id, d.organization, d.amount, d.date, d.recurring ? 'YES' : 'NO'
                    ])
                }
            ];

            // Clear existing data
            await window.gapi.client.sheets.spreadsheets.values.batchClear({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    ranges: [
                        'Transactions!A2:G',
                        'Incomes!A2:F',
                        'Subscriptions!A2:E',
                        'Investments!A2:F',
                        'Goals!A2:F',
                        'Donations!A2:E'
                    ]
                }
            });

            // Update with new data
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    data: updates,
                    valueInputOption: 'RAW'
                }
            });

            return true;
        } catch (error) {
            console.error('Error syncing to sheets:', error);
            throw error;
        }
    }

    // Load data from sheets
    async loadFromSheets() {
        if (!this.spreadsheetId) {
            throw new Error('No spreadsheet ID');
        }

        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
                spreadsheetId: this.spreadsheetId,
                ranges: [
                    'Transactions!A2:G',
                    'Incomes!A2:F',
                    'Subscriptions!A2:E',
                    'Investments!A2:F',
                    'Goals!A2:F',
                    'Donations!A2:E'
                ]
            });

            const ranges = response.result.valueRanges;
            const data = {
                transactions: [],
                incomes: [],
                subscriptions: [],
                investments: [],
                goals: [],
                donations: []
            };

            // Parse transactions
            if (ranges[0].values) {
                data.transactions = ranges[0].values.map(row => ({
                    id: parseInt(row[0]),
                    type: row[1],
                    title: row[2],
                    amount: parseFloat(row[3]),
                    category: row[4],
                    date: row[5],
                    notes: row[6]
                }));
            }

            // Parse incomes
            if (ranges[1].values) {
                data.incomes = ranges[1].values.map(row => ({
                    id: parseInt(row[0]),
                    title: row[1],
                    amount: parseFloat(row[2]),
                    currency: row[3],
                    date: row[4],
                    recurring: row[5] === 'YES'
                }));
            }

            // Parse subscriptions
            if (ranges[2].values) {
                data.subscriptions = ranges[2].values.map(row => ({
                    id: parseInt(row[0]),
                    name: row[1],
                    amount: parseFloat(row[2]),
                    billingDate: row[3],
                    category: row[4]
                }));
            }

            // Parse investments
            if (ranges[3].values) {
                data.investments = ranges[3].values.map(row => ({
                    id: parseInt(row[0]),
                    type: row[1],
                    name: row[2],
                    quantity: parseFloat(row[3]),
                    purchasePrice: parseFloat(row[4]),
                    currentValue: row[5] ? parseFloat(row[5]) : undefined
                }));
            }

            // Parse goals
            if (ranges[4].values) {
                data.goals = ranges[4].values.map(row => ({
                    id: parseInt(row[0]),
                    name: row[1],
                    targetAmount: parseFloat(row[2]),
                    currentAmount: parseFloat(row[3]),
                    deadline: row[4],
                    monthlySavings: row[5] ? parseFloat(row[5]) : undefined
                }));
            }

            // Parse donations
            if (ranges[5].values) {
                data.donations = ranges[5].values.map(row => ({
                    id: parseInt(row[0]),
                    organization: row[1],
                    amount: parseFloat(row[2]),
                    date: row[3],
                    recurring: row[4] === 'YES'
                }));
            }

            return data;
        } catch (error) {
            console.error('Error loading from sheets:', error);
            throw error;
        }
    }
}

// Create global instance
const googleSheets = new GoogleSheetsSync();