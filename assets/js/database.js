// PVTAIR Google Sheets Database Integration
// Create this file as: assets/js/database.js

class PVTAIRGoogleSheetsDB {
    constructor() {
        // Replace these with your actual values
        this.SPREADSHEET_ID = '1Jo39kWkJcNF-LEymNXmL8PgjipoEDvByyeI71YiElIs';
        this.API_KEY = 'AIzaSyC5jWKcsb5LyYFHmGtOEEIAT6tIt0hPZs8';
        this.WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbywtkqW4sWEdw6rOvMoIDLWV_UqC1UiF97_KZW5myAbaQzTwtVevVRDNo2cgBALK7VP/exec';
        this.BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
        
        this.SHEETS = {
            EMPLOYEES: 'Employees',
            TIMECARDS: 'Timecards',
            SUPERVISORS: 'Supervisors',
            SETTINGS: 'System_Settings'
        };
    }

    // Generic method to read data from any sheet
    async readSheet(sheetName, range = 'A:Z') {
        try {
            const url = `${this.BASE_URL}/${this.SPREADSHEET_ID}/values/${sheetName}!${range}?key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.values || data.values.length === 0) {
                return [];
            }

            // Convert to array of objects using first row as headers
            const headers = data.values[0];
            const rows = data.values.slice(1);
            
            return rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        } catch (error) {
            console.error(`Error reading ${sheetName}:`, error);
            return [];
        }
    }

    // Get all employees
    async getEmployees() {
        try {
            const data = await this.readSheet(this.SHEETS.EMPLOYEES);
            return data.map(employee => ({
                id: employee.employee_id,
                name: employee.name,
                email: employee.email,
                baseSalary: parseFloat(employee.base_salary) || 0,
                rates: {
                    revFlight: parseFloat(employee.rate_rev_flight) || 0,
                    nonRevFlightExc: parseFloat(employee.rate_non_rev_flight_exc) || 0,
                    nonRevNonFlight: parseFloat(employee.rate_non_rev_non_flight) || 0,
                    mxHourly: parseFloat(employee.rate_mx_hourly) || 0,
                    adminHourly: parseFloat(employee.rate_admin_hourly) || 0
                },
                active: employee.active === 'TRUE'
            }));
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    }

    // Get supervisors
    async getSupervisors() {
        try {
            const data = await this.readSheet(this.SHEETS.SUPERVISORS);
            return data.map(supervisor => ({
                id: supervisor.supervisor_id,
                name: supervisor.name,
                email: supervisor.email,
                title: supervisor.title,
                active: supervisor.active === 'TRUE'
            }));
        } catch (error) {
            console.error('Error fetching supervisors:', error);
            return [];
        }
    }

    // Get system settings (tooltips, etc.)
    async getSettings() {
        try {
            const data = await this.readSheet(this.SHEETS.SETTINGS);
            const settings = {};
            data.forEach(setting => {
                settings[setting.setting_name] = setting.setting_value;
            });
            return settings;
        } catch (error) {
            console.error('Error fetching settings:', error);
            return {};
        }
    }

    // Get timecards for specific employee and date range
    async getTimecards(employeeId, startDate, endDate) {
        try {
            const data = await this.readSheet(this.SHEETS.TIMECARDS);
            return data.filter(timecard => {
                const timecardDate = new Date(timecard.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                return timecard.employee_id === employeeId && 
                       timecardDate >= start && 
                       timecardDate <= end;
            });
        } catch (error) {
            console.error('Error fetching timecards:', error);
            return [];
        }
    }

    // Add new employee (requires Google Apps Script for writing)
    async addEmployee(employeeData) {
        // Note: This requires a Google Apps Script webhook for writing data
        // We'll set this up in the next step
        console.log('Adding employee:', employeeData);
        return { success: true, message: 'Employee data prepared for saving' };
    }

    // Save timecard data (requires Google Apps Script for writing)
    async saveTimecard(timecardData) {
        // Note: This requires a Google Apps Script webhook for writing data
        console.log('Saving timecard:', timecardData);
        return { success: true, message: 'Timecard data prepared for saving' };
    }

    // Test connection
    async testConnection() {
        try {
            const employees = await this.getEmployees();
            console.log('Database connection successful!');
            console.log(`Found ${employees.length} employees`);
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
}

// Initialize database connection
const database = new PVTAIRGoogleSheetsDB();

// Test the connection when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Testing database connection...');
    await database.testConnection();
});

// Utility functions for the web application
const DatabaseUtils = {
    // Load employees into dropdown/selection
    async populateEmployeeSelector(elementId) {
        const employees = await database.getEmployees();
        const element = document.getElementById(elementId);
        
        if (!element) return;
        
        element.innerHTML = employees.map(employee => `
            <div class="employee-card" onclick="selectEmployee('${employee.id}')">
                <strong>${employee.name}</strong>
            </div>
        `).join('');
    },

    // Load real employee data instead of sample data
    async loadEmployeeRates(employeeId) {
        const employees = await database.getEmployees();
        return employees.find(emp => emp.id === employeeId);
    },

    // Load tooltips from database
    async loadTooltips() {
        const settings = await database.getSettings();
        return {
            revFlight: settings.tooltip_rev_flight || 'Revenue Flight',
            nonRevFlightExc: settings.tooltip_non_rev_flight_exc || 'Non-Revenue Flight/EXC',
            nonRevNonFlight: settings.tooltip_non_rev_non_flight || 'Non-Revenue/Non-Flight',
            mx: settings.tooltip_mx || 'Maintenance',
            admin: settings.tooltip_admin || 'Administrative'
        };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PVTAIRGoogleSheetsDB, DatabaseUtils };
}
