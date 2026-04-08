import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  readonly featureCards = [
    {
      title: 'Guided campaign briefs',
      copy: 'Choose a goal, describe your audience, and get multi-channel campaign assets without staring at a blank page.'
    },
    {
      title: 'Brand-aware outputs',
      copy: 'Save your offer, voice, and preferred channels once so every draft starts closer to ready.'
    },
    {
      title: 'Launch from one workspace',
      copy: 'Import customer lists, review outputs, send email and SMS, and track campaign activity from a single app.'
    }
  ];

  readonly workflowSteps = [
    'Pick a campaign goal and target audience.',
    'Generate email, SMS, social, ad, and landing-page assets.',
    'Edit what matters, save drafts, or launch email and SMS.'
  ];

  readonly proofPoints = [
    'Built for small businesses and tiny teams',
    'Email and SMS execution in v1',
    'Template-first AI-assisted generation'
  ];

  constructor(private readonly router: Router) {}

  openApp(): void {
    this.router.navigate(['/login']);
  }

  startTrial(): void {
    this.router.navigate(['/register']);
  }
}
