const Profile = {
    getProfile: function() {
        const username = Auth.getCurrentUser();
        if (!username) return {};
        
        const profileData = localStorage.getItem(`profile_${username}`);
        if (profileData) {
            return JSON.parse(profileData);
        }
        
        return {
            name: username
        };
    },

    saveProfile: function(profileData) {
        const username = Auth.getCurrentUser();
        if (!username) return false;
        
        try {
            localStorage.setItem(`profile_${username}`, JSON.stringify(profileData));
            return true;
        } catch (error) {
            console.error('프로필 저장 실패', error);
            return false;
        }
    },

    loadProfile: function() {
        const profile = this.getProfile();
        
        document.getElementById('company').value = profile.company || '';
        document.getElementById('department').value = profile.department || '';
        document.getElementById('team').value = profile.team || '';
        document.getElementById('name').value = profile.name || Auth.getCurrentUser() || '';
        document.getElementById('position').value = profile.position || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('mobile').value = profile.mobile || '';
        document.getElementById('email').value = profile.email || '';
    },

    saveProfileFromForm: function() {
        const profileData = {
            company: document.getElementById('company').value.trim(),
            department: document.getElementById('department').value.trim(),
            team: document.getElementById('team').value.trim(),
            name: document.getElementById('name').value.trim(),
            position: document.getElementById('position').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            email: document.getElementById('email').value.trim()
        };
        
        if (this.saveProfile(profileData)) {
            alert('회원 정보가 저장되었습니다.');
            window.location.href = 'index.html';
        } else {
            alert('회원 정보 저장에 실패했습니다.');
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (Auth.isAuthenticated()) {
        Profile.loadProfile();
        
        const profileForm = document.getElementById('profileForm');
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            Profile.saveProfileFromForm();
        });
    }
});

