import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-cinematic-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cinematic-footer.component.html',
  styleUrls: ['./cinematic-footer.component.scss']
})
export class CinematicFooterComponent implements AfterViewInit {
  @ViewChild('footerContainer') footerContainer!: ElementRef<HTMLElement>;
  @ViewChild('parallaxText') parallaxText!: ElementRef<HTMLElement>;
  @ViewChild('magneticBtnTarget1') magneticBtn1!: ElementRef<HTMLElement>;
  @ViewChild('magneticBtnTarget2') magneticBtn2!: ElementRef<HTMLElement>;
  @ViewChild('marqueeInner') marqueeInner!: ElementRef<HTMLElement>;

  marqueeContent = [
    "Smart Campaign Automation",
    "Email & SMS Marketing",
    "Customer Data Management",
    "Real-time Campaign Tracking",
    "Secure & Scalable Platform"
  ];

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initAnimations();
      this.initMagneticButtons();
    }
  }

  initAnimations(): void {
    const ctx = gsap.context(() => {
      // Background Text Parallax
      gsap.to(this.parallaxText.nativeElement, {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: this.footerContainer.nativeElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });

      // Reveal Animation
      gsap.fromTo(".footer-reveal-item", 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: this.footerContainer.nativeElement,
            start: "top 80%",
          }
        }
      );

      // Aurora pulse animation
      gsap.to(".aurora-glow", {
        scale: 1.1,
        opacity: 0.8,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }, this.footerContainer.nativeElement);
  }

  initMagneticButtons(): void {
    const buttons = [this.magneticBtn1?.nativeElement, this.magneticBtn2?.nativeElement].filter(Boolean);
    
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.4,
          y: y * 0.4,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.3)"
        });
      });
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleAction(action: string): void {
    // Implement standard action routing for Velox
    console.log('Action triggered:', action);
  }
}
