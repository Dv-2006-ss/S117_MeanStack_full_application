import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  userName = 'Visitor';
  scrollProgress = signal(0);
  scrollOffset = signal(0);
  mouseX = signal(0);
  mouseY = signal(0);

  readonly heroPills = [
    'Hero product presentation',
    'Editorial website history',
    'Warm 3D glass depth'
  ];

  readonly heroStats = [
    { label: 'Story-led layout', value: '01' },
    { label: 'Benefit surfaces', value: '03' },
    { label: 'Depth treatment', value: '3D' }
  ];

  readonly floatingPanels = [
    {
      label: 'Clarity Layer',
      title: 'A product-first dashboard',
      copy: 'The first screen now feels like a premium product website instead of a plain utility page.'
    },
    {
      label: 'Benefit Layer',
      title: 'Big wins at a glance',
      copy: 'Benefits sit around the hero like launch highlights, so value is visible before the workflow starts.'
    },
    {
      label: 'Motion Layer',
      title: 'Glass panels with depth',
      copy: 'Scroll and cursor motion give the dashboard a soft cinematic lift without sacrificing readability.'
    }
  ];

  readonly storyMoments = [
    {
      phase: 'Phase 01',
      title: 'Everything began fragmented.',
      copy: 'Contacts, templates, send history, and campaign planning used to feel like separate tasks with separate moods.',
      detail: 'The redesign starts by turning that fragmentation into one calm narrative surface.'
    },
    {
      phase: 'Phase 02',
      title: 'The product story became visible.',
      copy: 'Instead of hiding your identity under tables, the dashboard now leads with what the platform is and why it matters.',
      detail: 'That makes the product feel intentional, brand-led, and easier to trust.'
    },
    {
      phase: 'Phase 03',
      title: 'Benefits moved to the front.',
      copy: 'The strongest dashboards show the promise of the system before asking users to dive into details.',
      detail: 'That is why the benefits now behave like highlighted product cards inside the scroll story.'
    }
  ];

  readonly benefitCards = [
    {
      tag: 'Audience Memory',
      title: 'Your customer context stays in one place.',
      copy: 'Lists, targeting logic, and send intent feel connected, so the product reads as one operating layer.',
      points: ['Cleaner segmentation', 'Faster campaign setup', 'Less tool switching']
    },
    {
      tag: 'Message Precision',
      title: 'Templates feel crafted, not assembled.',
      copy: 'The visual language now supports premium content building with calmer hierarchy and stronger product presence.',
      points: ['Focused editing flow', 'More premium presentation', 'Better first impression']
    },
    {
      tag: 'Delivery Rhythm',
      title: 'Performance still feels live and readable.',
      copy: 'Even with the new morphism treatment, the dashboard still shows momentum, health, and next actions clearly.',
      points: ['Visible campaign health', 'Action-ready metrics', 'Readable signal cards']
    }
  ];

  readonly liveSignals = [
    {
      label: 'Active audience',
      value: '24.8k',
      copy: 'Warm segments ready for launch across the next campaign window.'
    },
    {
      label: 'Template precision',
      value: '96%',
      copy: 'Message structure is aligned across email and SMS surfaces.'
    },
    {
      label: 'Delivery momentum',
      value: '+18%',
      copy: 'Recent sends are performing with steadier timing and cleaner orchestration.'
    },
    {
      label: 'Next move',
      value: 'Launch',
      copy: 'The system is staged for the next campaign build without extra setup noise.'
    }
  ];

  private scrollHost: HTMLElement | null = null;

  private readonly scrollListener = () => {
    this.syncScrollState();
  };

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.userName = user.name.split(' ')[0];
    }
  }

  ngAfterViewInit(): void {
    this.scrollHost = document.querySelector<HTMLElement>('.app-main');
    this.scrollHost?.addEventListener('scroll', this.scrollListener, { passive: true });
    this.syncScrollState();
  }

  ngOnDestroy(): void {
    this.scrollHost?.removeEventListener('scroll', this.scrollListener);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isCompactLayout()) {
      return;
    }

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    this.mouseX.set(x);
    this.mouseY.set(y);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncScrollState();
  }

  onBuildClick(): void {
    this.router.navigate(['/campaigns-form']);
  }

  heroTransform(): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const lift = this.scrollProgress() * 34;
    const depth = 32 + this.scrollProgress() * 24;
    const rotateY = this.mouseX() * 12;
    const rotateX = this.mouseY() * -10 - this.scrollProgress() * 2.5;

    return `perspective(2400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(0, ${lift}px, ${depth}px)`;
  }

  productCoreTransform(): string {
    if (this.isCompactLayout()) {
      return 'translate(-50%, -50%)';
    }

    const driftY = -10 + this.scrollProgress() * 16;
    const depth = 120 + this.scrollProgress() * 30;
    const rotateY = this.mouseX() * 18;
    const rotateX = this.mouseY() * -8;

    return `translate(-50%, -50%) translate3d(0, ${driftY}px, ${depth}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  proofChipTransform(index: number): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const depth = 16 + index * 10;
    const offsetY = index === 1 ? 10 : 0;

    return `translate3d(0, ${offsetY}px, ${depth}px)`;
  }

  floatingPanelTransform(index: number): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const config = [
      { z: 88, offset: -10, rotateX: -6, rotateY: -14 },
      { z: 104, offset: 6, rotateX: 6, rotateY: 12 },
      { z: 96, offset: 20, rotateX: -5, rotateY: 10 }
    ][index];

    const moveY = config.offset + this.scrollProgress() * (12 + index * 5) + this.mouseY() * 18;
    const moveX = this.mouseX() * (18 + index * 5);

    return `translate3d(${moveX}px, ${moveY}px, ${config.z + this.scrollProgress() * 18}px) rotateX(${config.rotateX - this.mouseY() * 6}deg) rotateY(${config.rotateY + this.mouseX() * 12}deg)`;
  }

  surfaceTransform(
    start: number,
    travel: number,
    depth: number,
    rotateX: number,
    rotateY = 0
  ): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const progress = this.rangeProgress(start, 760);

    return `perspective(2200px) translate3d(0, ${progress * travel}px, ${progress * depth}px) rotateX(${rotateX - progress * 4}deg) rotateY(${rotateY + progress * 3}deg)`;
  }

  storyCardTransform(index: number): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const progress = this.rangeProgress(180, 720);
    const depth = 24 + index * 24 + progress * 18;
    const lift = progress * index * 14;
    const rotateY = -8 + index * 5 + progress * 2;

    return `translate3d(0, ${lift}px, ${depth}px) rotateX(${4 - progress * 2}deg) rotateY(${rotateY}deg)`;
  }

  benefitCardTransform(index: number): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const progress = this.rangeProgress(460, 720);
    const baseDepth = [18, 44, 26][index];
    const offsetY = index === 1 ? -8 : 10;
    const rotateY = index === 0 ? -8 : index === 2 ? 8 : 0;

    return `translate3d(0, ${offsetY + progress * 12}px, ${baseDepth + progress * 18}px) rotateX(${3 - progress}deg) rotateY(${rotateY}deg)`;
  }

  signalCardTransform(index: number): string {
    if (this.isCompactLayout()) {
      return 'none';
    }

    const progress = this.rangeProgress(760, 680);
    const depth = 16 + index * 12 + progress * 14;
    const lift = index % 2 === 0 ? 0 : -10 + progress * 12;
    const rotateY = index === 0 ? -4 : index === 3 ? 4 : 0;

    return `translate3d(0, ${lift}px, ${depth}px) rotateX(${2 - progress}deg) rotateY(${rotateY}deg)`;
  }

  private syncScrollState(): void {
    const scrollTop = this.scrollHost?.scrollTop
      ?? window.pageYOffset
      ?? document.documentElement.scrollTop
      ?? 0;
    const viewportHeight = this.scrollHost?.clientHeight || window.innerHeight || 1;
    const progress = Math.min(scrollTop / Math.max(viewportHeight * 0.95, 1), 1);

    this.scrollOffset.set(scrollTop);
    this.scrollProgress.set(progress);
  }

  private rangeProgress(start: number, distance: number): number {
    const rawProgress = (this.scrollOffset() - start) / distance;
    return Math.max(0, Math.min(rawProgress, 1));
  }

  private isCompactLayout(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1180;
  }
}
