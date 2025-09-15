/**
 * PVTAIR Database Integration
 * Google Sheets Only - No Sample Data
 * File: assets/js/database.js
 */

class PVTAIRDatabase {
    constructor() {
        // Google Apps Script Configuration
        this.spreadsheetId = '1Jo39kWkJcNF-LEymNXmL8PgjipoEDvByyeI71YiElIs';
        this.deploymentId = 'AKfycbw90GaSrPn89Yuewe83Z3kokuSPebEaJwcjUxUE0DxkD2qsxpEUQAYWFyrrM0tOJkTS';
        this.scriptUrl = 'https://script.google.com/macros/s/AKfycbw90GaSrPn89Yuewe83Z3kokuSPebEaJwcjUxUE0DxkD2qsxpEUQAYWFyrrM0tOJkTS/exec';
        
        // Connection status
        this.isConnected = false;
        this.lastConnectionTest = null;
        
        console.log('PVTAIR Database initialized with Google Sheets integration');
    }

    /**
     * Initialize database connection
     * @returns {Promise<boolean>} Connection success status
     */
    async init() {
        try {
            console.log('Initializing PVTAIR Database connection...');
            await this.testConnection();
            this.isConnected = true;
            console.log('✅ Database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Test connection to Google Apps Script
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.scriptUrl}?action=test&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.lastConnectionTest = new Date();
            
            console.log('🔗 Connection test successful:', result);
            return result;
            
        } catch (error) {
            console.error('🔗 Connection test failed:', error);
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Get all employees from Google Sheets
     * @returns {Promise<Array>} Array of employee objects
     */
    async getEmployees() {
        try {
            console.log('📋 Fetching employees from Google Sheets...');
            
            const response = await fetch(`${this.scriptUrl}?action=getEmployees&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const employees = result.data || [];
            console.log(`✅ Loaded ${employees.length} employees from Google Sheets`);
            
            return employees;
            
        } catch (error) {
            console.error('❌ Failed to load employees:', error);
            throw new Error(`Failed to load employees: ${error.message}`);
        }
    }

    /**
     * Get all supervisors from Google Sheets
     * @returns {Promise<Array>} Array of supervisor objects
     */
    async getSupervisors() {
        try {
            console.log('👨‍💼 Fetching supervisors from Google Sheets...');
            
            const response = await fetch(`${this.scriptUrl}?action=getSupervisors&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const supervisors = result.data || [];
            console.log(`✅ Loaded ${supervisors.length} supervisors from Google Sheets`);
            
            return supervisors;
            
        } catch (error) {
            console.error('❌ Failed to load supervisors:', error);
            throw new Error(`Failed to load supervisors: ${error.message}`);
        }
    }

    /**
     * Get timecards from Google Sheets
     * @param {string} employeeId - Optional employee ID filter
     * @param {string} dateRange - Optional date range filter
     * @param {string} status - Optional status filter (pending, approved, rejected)
     * @returns {Promise<Array>} Array of timecard objects
     */
    async getTimecards(employeeId = null, dateRange = null, status = null) {
        try {
            console.log('⏰ Fetching timecards from Google Sheets...');
            
            let url = `${this.scriptUrl}?action=getTimecards&timestamp=${Date.now()}`;
            
            if (employeeId) url += `&employeeId=${encodeURIComponent(employeeId)}`;
            if (dateRange) url += `&dateRange=${encodeURIComponent(dateRange)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const timecards = result.data || [];
            console.log(`✅ Loaded ${timecards.length} timecards from Google Sheets`);
            
            return timecards;
            
        } catch (error) {
            console.error('❌ Failed to load timecards:', error);
            throw new Error(`Failed to load timecards: ${error.message}`);
        }
    }

    /**
     * Submit a new timecard to Google Sheets
     * @param {Object} timecardData - Timecard data object
     * @returns {Promise<Object>} Submission result
     */
    async submitTimecard(timecardData) {
        try {
            console.log('📝 Submitting timecard to Google Sheets...', timecardData);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submitTimecard',
                    data: timecardData,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Timecard submitted successfully:', result);
            return {
                success: true,
                message: 'Timecard submitted successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to submit timecard:', error);
            return {
                success: false,
                message: `Failed to submit timecard: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Update timecard status (approve/reject)
     * @param {string} timecardId - Timecard ID
     * @param {string} status - New status (approved, rejected, pending)
     * @param {string} supervisorId - Supervisor making the change
     * @param {string} comments - Optional comments
     * @returns {Promise<Object>} Update result
     */
    async updateTimecardStatus(timecardId, status, supervisorId, comments = '') {
        try {
            console.log(`🔄 Updating timecard ${timecardId} status to ${status}`);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateTimecardStatus',
                    timecardId: timecardId,
                    status: status,
                    supervisorId: supervisorId,
                    comments: comments,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Timecard status updated successfully:', result);
            return {
                success: true,
                message: 'Timecard status updated successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to update timecard status:', error);
            return {
                success: false,
                message: `Failed to update timecard status: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add new employee to Google Sheets
     * @param {Object} employeeData - Employee data object
     * @returns {Promise<Object>} Addition result
     */
    async addEmployee(employeeData) {
        try {
            console.log('👤 Adding new employee to Google Sheets...', employeeData);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addEmployee',
                    data: employeeData,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Employee added successfully:', result);
            return {
                success: true,
                message: 'Employee added successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to add employee:', error);
            return {
                success: false,
                message: `Failed to add employee: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Update employee information in Google Sheets
     * @param {string} employeeId - Employee ID
     * @param {Object} employeeData - Updated employee data
     * @returns {Promise<Object>} Update result
     */
    async updateEmployee(employeeId, employeeData) {
        try {
            console.log(`🔄 Updating employee ${employeeId} in Google Sheets...`);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateEmployee',
                    employeeId: employeeId,
                    data: employeeData,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Employee updated successfully:', result);
            return {
                success: true,
                message: 'Employee updated successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to update employee:', error);
            return {
                success: false,
                message: `Failed to update employee: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Delete employee from Google Sheets
     * @param {string} employeeId - Employee ID to delete
     * @returns {Promise<Object>} Deletion result
     */
    async deleteEmployee(employeeId) {
        try {
            console.log(`🗑️ Deleting employee ${employeeId} from Google Sheets...`);
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deleteEmployee',
                    employeeId: employeeId,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Employee deleted successfully:', result);
            return {
                success: true,
                message: 'Employee deleted successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to delete employee:', error);
            return {
                success: false,
                message: `Failed to delete employee: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Get system statistics from Google Sheets
     * @returns {Promise<Object>} System statistics
     */
    async getSystemStats() {
        try {
            console.log('📊 Fetching system statistics from Google Sheets...');
            
            const response = await fetch(`${this.scriptUrl}?action=getSystemStats&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const stats = result.data || {};
            console.log('✅ System statistics loaded:', stats);
            
            return stats;
            
        } catch (error) {
            console.error('❌ Failed to load system statistics:', error);
            throw new Error(`Failed to load system statistics: ${error.message}`);
        }
    }

    /**
     * Export data from Google Sheets
     * @param {string} type - Export type (employees, timecards, all)
     * @param {string} format - Export format (json, csv)
     * @returns {Promise<Object>} Export result
     */
    async exportData(type = 'all', format = 'json') {
        try {
            console.log(`📤 Exporting ${type} data in ${format} format...`);
            
            const response = await fetch(`${this.scriptUrl}?action=exportData&type=${type}&format=${format}&timestamp=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ Data export completed:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to export data:', error);
            throw new Error(`Failed to export data: ${error.message}`);
        }
    }

    /**
     * Approve all pending timecards
     * @param {string} supervisorId - Supervisor approving the timecards
     * @returns {Promise<Object>} Approval result
     */
    async approveAllPendingTimecards(supervisorId) {
        try {
            console.log('✅ Approving all pending timecards...');
            
            const response = await fetch(this.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'approveAllPending',
                    supervisorId: supervisorId,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('✅ All pending timecards approved:', result);
            return {
                success: true,
                message: 'All pending timecards approved successfully',
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ Failed to approve all pending timecards:', error);
            return {
                success: false,
                message: `Failed to approve timecards: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Get connection status
     * @returns {boolean} Connection status
     */
    isConnectionHealthy() {
        return this.isConnected && this.lastConnectionTest && 
               (Date.now() - this.lastConnectionTest.getTime()) < 300000; // 5 minutes
    }

    /**
     * Get database configuration info
     * @returns {Object} Configuration information
     */
    getConfig() {
        return {
            spreadsheetId: this.spreadsheetId,
            deploymentId: this.deploymentId,
            scriptUrl: this.scriptUrl,
            isConnected: this.isConnected,
            lastConnectionTest: this.lastConnectionTest
        };
    }
}

// Create global database instance
const database = new PVTAIRDatabase();

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing PVTAIR Database...');
    
    const initialized = await database.init();
    
    if (initialized) {
        console.log('✅ PVTAIR Database ready for use');
        
        // Trigger any page-specific initialization
        if (typeof onDatabaseReady === 'function') {
            onDatabaseReady();
        }
        
        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('databaseReady', {
            detail: { database: database }
        }));
        
    } else {
        console.warn('⚠️ Database initialization failed - check Google Apps Script configuration');
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('databaseError', {
            detail: { message: 'Failed to initialize database connection' }
        }));
    }
});

// Periodic connection health check (every 5 minutes)
setInterval(async () => {
    if (!database.isConnectionHealthy()) {
        console.log('🔄 Testing database connection health...');
        try {
            await database.testConnection();
            database.isConnected = true;
            console.log('✅ Database connection restored');
            
            // Dispatch reconnection event
            window.dispatchEvent(new CustomEvent('databaseReconnected', {
                detail: { database: database }
            }));
            
        } catch (error) {
            database.isConnected = false;
            console.error('❌ Database connection still unhealthy:', error);
            
            // Dispatch connection error event
            window.dispatchEvent(new CustomEvent('databaseConnectionError', {
                detail: { error: error.message }
            }));
        }
    }
}, 5 * 60 * 1000);

// Auto-clear cache every 30 minutes to ensure fresh data
setInterval(() => {
    console.log('🧹 Auto-clearing cache for fresh data');
    database.clearCache();
}, 30 * 60 * 1000);

// Export database for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PVTAIRDatabase;
}

// Make database available globally
window.database = database;
window.PVTAIRDatabase = PVTAIRDatabase;

// Add global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection in database:', event.reason);
    
    // Dispatch global error event
    window.dispatchEvent(new CustomEvent('databaseUnhandledError', {
        detail: { error: event.reason }
    }));
});

// Utility functions for debugging
window.debugDatabase = {
    getConfig: () => database.getConfig(),
    clearCache: () => database.clearCache(),
    reconnect: () => database.reconnect(),
    testConnection: () => database.testConnection(),
    isHealthy: () => database.isConnectionHealthy()
};

console.log('📦 PVTAIR Database module loaded successfully');
console.log('🔧 Debug tools available via window.debugDatabase');

/**
 * Usage Examples:
 * 
 * // Basic usage
 * const employees = await database.getEmployees();
 * const result = await database.submitTimecard(data);
 * 
 * // Listen for events
 * window.addEventListener('databaseReady', () => console.log('DB Ready!'));
 * window.addEventListener('databaseError', () => console.log('DB Error!'));
 * 
 * // Debug tools
 * window.debugDatabase.getConfig(); // Check configuration
 * window.debugDatabase.clearCache(); // Clear all cached data
 * window.debugDatabase.reconnect(); // Force reconnection
 */
