/**
 * PVTAIR Timecard Database Integration with Google Sheets API
 * This file handles all Google Sheets operations for the timecard system
 */

// Configuration - UPDATE THESE VALUES FOR YOUR SETUP
const CONFIG = {
    // Replace with your Google Sheets API key
    API_KEY: 'AIzaSyC5jWKcsb5LyYFHmGtOEEIAT6tIt0hPZs8',
    
    // Replace with your Google Spreadsheet ID (from the URL)
    SPREADSHEET_ID: '1Jo39kWkJcNF-LEymNXmL8PgjipoEDvByyeI71YiElIs',
    
    // Sheet names/ranges - adjust if your sheets have different names
    EMPLOYEES_RANGE: 'Employees!A:H',  // Employees data sheet
    TIMECARD_RANGE: 'Timecards!A:I',  // Timecard data sheet
    
    // Discovery document for Google Sheets API
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4'
};

// Global database object that your timecard website will use
window.database = {
    isInitialized: false,
    employees: [],
    
    /**
     * Initialize the Google Sheets API
     */
    async init() {
        try {
            console.log('Initializing Google Sheets API...');
            
            // Load Google API
            await this.loadGoogleAPI();
            
            // Initialize the API
            await gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: CONFIG.API_KEY,
                    discoveryDocs: [CONFIG.DISCOVERY_DOC]
                });
                
                this.isInitialized = true;
                console.log('Database connection successful!');
                
                // Load employees on initialization
                await this.loadEmployees();
            });
            
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    },
    
    /**
     * Load Google API script dynamically
     */
    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    /**
     * Load employees from Google Sheets
     */
    async loadEmployees() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: CONFIG.EMPLOYEES_RANGE
            });
            
            const rows = response.result.values;
            if (!rows || rows.length === 0) {
                console.warn('No employee data found in spreadsheet');
                this.employees = [];
                return [];
            }
            
            // Parse employee data (skip header row)
            const headers = rows[0];
            this.employees = [];
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length > 0 && row[0]) { // Skip empty rows
                    const employee = this.parseEmployeeRow(headers, row);
                    if (employee) {
                        this.employees.push(employee);
                    }
                }
            }
            
            console.log(`Found ${this.employees.length} employees`);
            return this.employees;
            
        } catch (error) {
            console.error('Error loading employees:', error);
            throw error;
        }
    },
    
    /**
     * Parse a single employee row from spreadsheet
     */
    parseEmployeeRow(headers, row) {
        try {
            // Map common column names (adjust these to match your spreadsheet)
            const getColumnValue = (possibleNames) => {
                for (const name of possibleNames) {
                    const index = headers.findIndex(h => 
                        h.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
                    );
                    if (index >= 0 && row[index]) {
                        return row[index];
                    }
                }
                return null;
            };
            
            // Extract employee data
            const id = getColumnValue(['employee_id', 'employeeid', 'id', 'employee id']);
            const name = getColumnValue(['name', 'employee_name', 'employeename', 'full_name']);
            const baseSalary = getColumnValue(['base_salary', 'basesalary', 'salary', 'base salary']);
            const revFlightRate = getColumnValue(['rev_flight_rate', 'revflight', 'rev flight', 'revenue flight rate']);
            const nonRevRate = getColumnValue(['non_rev_rate', 'nonrev', 'non rev', 'non revenue rate']);
            const nonRevNonFlightRate = getColumnValue(['non_rev_non_flight', 'nonrevnonflight', 'non rev non flight']);
            const mxRate = getColumnValue(['mx_rate', 'mxrate', 'mx', 'maintenance rate']);
            const adminRate = getColumnValue(['admin_rate', 'adminrate', 'admin', 'administrative rate']);
            
            if (!id || !name) {
                console.warn('Skipping employee row - missing ID or name:', row);
                return null;
            }
            
            return {
                id: String(id).toLowerCase().replace(/[^a-z0-9]/g, ''), // Clean ID format
                name: String(name),
                baseSalary: parseFloat(baseSalary) || 0,
                rates: {
                    revFlight: parseFloat(revFlightRate) || 0,
                    nonRevFlightExc: parseFloat(nonRevRate) || 0,
                    nonRevNonFlight: parseFloat(nonRevNonFlightRate) || 0,
                    mxHourly: parseFloat(mxRate) || 0,
                    adminHourly: parseFloat(adminRate) || 0
                }
            };
            
        } catch (error) {
            console.error('Error parsing employee row:', row, error);
            return null;
        }
    },
    
    /**
     * Get all employees (main function used by timecard)
     */
    async getEmployees() {
        try {
            if (this.employees.length === 0) {
                await this.loadEmployees();
            }
            return this.employees;
        } catch (error) {
            console.error('Error getting employees:', error);
            return [];
        }
    },
    
    /**
     * Save timecard data to Google Sheets
     */
    async saveTimecard(employeeId, date, hours) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }
            
            // Find or create row for this employee/date combination
            const rowData = [
                employeeId,
                date,
                hours.revFlight || 0,
                hours.nonRevFlightExc || 0,
                hours.nonRevNonFlight || 0,
                hours.mx || 0,
                hours.admin || 0,
                new Date().toISOString(), // timestamp
                'submitted' // status
            ];
            
            // Check if timecard already exists
            const existingRow = await this.findTimecardRow(employeeId, date);
            
            if (existingRow >= 0) {
                // Update existing row
                await this.updateTimecardRow(existingRow + 2, rowData); // +2 for header and 0-based index
            } else {
                // Append new row
                await this.appendTimecardRow(rowData);
            }
            
            console.log(`Timecard saved for ${employeeId} on ${date}`);
            return { success: true, employeeId, date, hours };
            
        } catch (error) {
            console.error('Error saving timecard:', error);
            throw error;
        }
    },
    
    /**
     * Find existing timecard row
     */
    async findTimecardRow(employeeId, date) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: CONFIG.TIMECARD_RANGE
            });
            
            const rows = response.result.values;
            if (!rows || rows.length <= 1) return -1;
            
            // Skip header row, find matching employee/date
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[0] === employeeId && row[1] === date) {
                    return i - 1; // Return 0-based index excluding header
                }
            }
            
            return -1;
        } catch (error) {
            console.error('Error finding timecard row:', error);
            return -1;
        }
    },
    
    /**
     * Update existing timecard row
     */
    async updateTimecardRow(rowNumber, data) {
        const range = `Timecards!A${rowNumber}:I${rowNumber}`;
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: [data]
            }
        });
    },
    
    /**
     * Append new timecard row
     */
    async appendTimecardRow(data) {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: 'Timecards!A:I',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [data]
            }
        });
    },
    
    /**
     * Get timecard data for specific employee and date
     */
    async getTimecard(employeeId, date) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: CONFIG.TIMECARD_RANGE
            });
            
            const rows = response.result.values;
            if (!rows || rows.length <= 1) return null;
            
            // Find matching timecard
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[0] === employeeId && row[1] === date) {
                    return {
                        employeeId: row[0],
                        date: row[1],
                        revFlight: parseFloat(row[2]) || 0,
                        nonRevFlightExc: parseFloat(row[3]) || 0,
                        nonRevNonFlight: parseFloat(row[4]) || 0,
                        mx: parseFloat(row[5]) || 0,
                        admin: parseFloat(row[6]) || 0,
                        timestamp: row[7],
                        status: row[8]
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting timecard:', error);
            return null;
        }
    },
    
    /**
     * Test database connection
     */
    async testConnection() {
        try {
            await this.init();
            const employees = await this.getEmployees();
            return {
                success: true,
                message: `Connected successfully. Found ${employees.length} employees.`,
                employees: employees
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error
            };
        }
    }
};

// Auto-initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.database.init();
    } catch (error) {
        console.error('Failed to initialize database on page load:', error);
    }
});

// Export for debugging
window.databaseConfig = CONFIG;
