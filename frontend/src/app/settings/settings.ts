import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../core/services/toast';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.html',
    styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
    activeTab = 'profile';

    // Profile Data
    userProfile = {
        name: '',
        email: '',
        phone: '',
        company: '',
        role: 'Marketing Manager',
        timezone: 'UTC+5:30 (India Standard Time)'
    };

    // Notification Preferences
    notifications = {
        emailAlerts: true,
        smsAlerts: false,
        marketingUpdates: true,
        campaignReports: true
    };

    passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    isSaving = false;

    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        // Listen to URL parameters to switch to the right tab
        this.route.queryParams.subscribe(params => {
            if (params['tab']) {
                this.activeTab = params['tab'];
            }
        });

        const user = this.authService.getCurrentUser?.() || JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.userProfile.name = user.name || user.Name || '';
        this.userProfile.email = user.email || '';
        this.userProfile.company = user.companyName || '';
        this.userProfile.role = user.role || 'Marketing Manager';
        this.userProfile.timezone = user.timezone || 'UTC+5:30 (India Standard Time)';

        if (user.notifications) {
            this.notifications = { ...this.notifications, ...user.notifications };
        }
    }

    comingSoon(feature: string) {
        this.toastService.show(`${feature} is coming soon!`, 'info');
    }

    setTab(tab: string) {
        this.activeTab = tab;
    }

    saveProfile() {
        this.isSaving = true;
        this.authService.updateProfile({
            name: this.userProfile.name,
            companyName: this.userProfile.company,
            role: this.userProfile.role,
            timezone: this.userProfile.timezone
        }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.toastService.show('Profile information updated successfully.', 'success');
                // update local storage with new user
                const curr = JSON.parse(localStorage.getItem('currentUser') || '{}');
                localStorage.setItem('currentUser', JSON.stringify({ ...curr, ...res.user }));
            },
            error: (err) => {
                this.isSaving = false;
                this.toastService.show('Failed to update profile: ' + (err.error?.message || err.message), 'error');
            }
        });
    }

    saveNotifications() {
        this.isSaving = true;
        this.authService.updateNotifications({
            notifications: this.notifications
        }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.toastService.show('Notification preferences saved.', 'success');
                const curr = JSON.parse(localStorage.getItem('currentUser') || '{}');
                curr.notifications = res.notifications;
                localStorage.setItem('currentUser', JSON.stringify(curr));
            },
            error: (err) => {
                this.isSaving = false;
                this.toastService.show('Failed to save notifications: ' + (err.error?.message || err.message), 'error');
            }
        });
    }

    updatePassword() {
        if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
            this.toastService.show("Please fill in all password fields.", "error");
            return;
        }

        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
            this.toastService.show("New passwords do not match.", "error");
            return;
        }

        this.isSaving = true;
        this.authService.updatePassword({
            currentPassword: this.passwordForm.currentPassword,
            newPassword: this.passwordForm.newPassword
        }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.toastService.show('Password updated successfully!', 'success');
                this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
            },
            error: (err) => {
                this.isSaving = false;
                this.toastService.show('Failed to update password: ' + (err.error?.message || err.message), 'error');
            }
        });
    }
}
