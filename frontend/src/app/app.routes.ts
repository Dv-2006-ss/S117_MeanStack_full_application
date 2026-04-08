import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { HomeComponent } from './marketing/home/home';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CampaignFormComponent } from './campaigns/campaign-form/campaign-form';
import { EmailBuilderComponent } from './campaigns/email-builder/email-builder';
import { SmsBuilderComponent } from './campaigns/sms-builder/sms-builder';
import { CampaignListComponent } from './campaigns/campaign-list/campaign-list';
import { AuthGuard } from './auth/auth.guard';
import { SettingsComponent } from './settings/settings';
import { TemplatesComponent } from './campaigns/templates/templates';
export const routes: Routes = [

  { path: '', component: HomeComponent },

  // public pages
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // protected pages
  {
    path: 'app/dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'app/customers',
    component: CustomerListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'app/campaigns',
    component: CampaignListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'app/campaigns/new',
    component: CampaignFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'email-builder',
    component: EmailBuilderComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'app/templates',
    component: TemplatesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'sms-builder',
    component: SmsBuilderComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'app/settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },

  // fallback
  { path: '**', redirectTo: '' }

];
