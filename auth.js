const Auth = {
    isAuthenticated: function() {
        const token = localStorage.getItem('authToken');
        const expiry = localStorage.getItem('authExpiry');
        
        if (!token || !expiry) {
            return false;
        }

        if (new Date().getTime() > parseInt(expiry)) {
            this.logout();
            return false;
        }

        return true;
    },

    login: function(username, password, remember = false) {
        const users = {
            'admin': 'password',
            'sales1': 'sales123',
            'sales2': 'sales123',
            'sales3': 'sales123',
            'sales4': 'sales123',
            'sales5': 'sales123'
        };

        if (users[username] && users[username] === password) {
            const token = btoa(username + ':' + Date.now());
            const expiry = remember 
                ? new Date().getTime() + (30 * 24 * 60 * 60 * 1000)
                : new Date().getTime() + (24 * 60 * 60 * 1000);

            localStorage.setItem('authToken', token);
            localStorage.setItem('authExpiry', expiry.toString());
            localStorage.setItem('authUser', username);

            return { success: true, username };
        }

        return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    },

    logout: function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authExpiry');
        localStorage.removeItem('authUser');
        window.location.href = 'login.html';
    },

    getCurrentUser: function() {
        return localStorage.getItem('authUser') || null;
    },

    requireAuth: function() {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname;
            const currentPage = currentPath.split('/').pop() || 'index.html';
            
            if (currentPage !== 'login.html') {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
            }
        }
    }
};

