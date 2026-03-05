import { Component } from '@angular/core';
import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CampaignFormComponent } from './campaigns/campaign-form/campaign-form';
import { EmailBuilderComponent } from './campaigns/email-builder/email-builder';
import { SmsBuilderComponent } from './campaigns/sms-builder/sms-builder';
import { CampaignListComponent } from './campaigns/campaign-list/campaign-list';
import { AuthGuard } from './auth/auth.guard';
import { SettingsComponent } from './settings/settings';

export const routes: Routes = [

  // default → dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // public pages
  { path: 'dashboard', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // protected pages
  {
    path: 'customers',
    component: CustomerListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'campaigns',
    component: CampaignListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'campaigns-form',
    component: CampaignFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'email-builder',
    component: EmailBuilderComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'sms-builder',
    component: SmsBuilderComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },

  // fallback
  { path: '**', redirectTo: 'dashboard' }

];
