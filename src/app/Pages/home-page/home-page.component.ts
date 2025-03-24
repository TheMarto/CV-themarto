import { AfterViewInit, Component, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home-page',
  standalone: false,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements AfterViewInit, OnDestroy  {
  
  // Referencias a los paneles
  @ViewChildren('panel') panelElements!: QueryList<ElementRef>;
  
  private isScrolling = false;
  private currentIndex = 0;
  private panels: HTMLElement[] = [];
  private readonly isBrowser: boolean;
  
  // Manejadores de eventos vinculados
  private boundHandleScroll: any;
  private boundHandleTouchStart: any;
  private boundHandleTouchMove: any;
  
  // Variables para el control táctil
  private touchStartY = 0;
  private lastY = 0;
  
  constructor(@Inject(PLATFORM_ID) platformId: Object, private elementRef: ElementRef) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Vincular manejadores de eventos para poder eliminarlos posteriormente
    if (this.isBrowser) {
      this.boundHandleScroll = this.handleScroll.bind(this);
      this.boundHandleTouchStart = this.handleTouchStart.bind(this);
      this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    }
  }
  
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    
    // Dar tiempo al DOM para cargarse completamente
    setTimeout(() => {
      this.initScrollBehavior();
      
      // Asegurarse de que la primera sección sea visible al inicio
      this.scrollToPanel(0);
    }, 500);
  }
  
  private initScrollBehavior(): void {
    if (!this.isBrowser) return;
    
    // Obtener todos los paneles del DOM
    this.panels = Array.from(this.elementRef.nativeElement.querySelectorAll('.panel'));
    
    if (!this.panels || this.panels.length === 0) {
      console.error('No se encontraron elementos con la clase "panel".');
      return;
    }
    
    console.log(`Inicializando scroll con ${this.panels.length} paneles`);
    
    // Configurar los event listeners con opciones passive: false para prevenir el scroll nativo
    window.addEventListener('wheel', this.boundHandleScroll, { passive: false });
    window.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    
    // Añadir listener para teclas de flecha
    window.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Configurar la primera sección como activa
    this.setActivePanel(0);
  }
  
  // Añadir navegación por teclado
  private handleKeydown(e: KeyboardEvent): void {
    if (this.isScrolling) return;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        this.goToNextSection();
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        this.goToPrevSection();
        break;
    }
  }
  
  // Variables para controlar la sensibilidad del scroll
  private lastScrollTime = 0;
  private scrollThreshold = 10; // Umbral de desplazamiento para activar el cambio de sección
  private scrollCooldown = 100; // Tiempo mínimo entre cambios de sección en ms
  
  private handleScroll(e: WheelEvent): void {
    // Prevenimos el evento por defecto para tener control total sobre el scroll
    e.preventDefault();
    
    if (this.isScrolling) return;
    
    const now = new Date().getTime();
    // Verifica si ha pasado suficiente tiempo desde el último scroll
    if (now - this.lastScrollTime < this.scrollCooldown) return;
    
    // Guarda el tiempo del scroll actual
    this.lastScrollTime = now;
    
    // Aumentamos la sensibilidad detectando incluso pequeños movimientos
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.min(Math.max(this.currentIndex + direction, 0), this.panels.length - 1);
    
    if (newIndex !== this.currentIndex) {
      console.log(`Scroll detectado: dirección ${direction}, moviendo a sección ${newIndex}`);
      this.scrollToPanel(newIndex);
    }
  }
  
  private handleTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
    this.lastY = this.touchStartY;
  }
  
  private handleTouchMove(e: TouchEvent): void {
    if (this.isScrolling) {
      e.preventDefault();
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - this.lastY;
    this.lastY = currentY;
    
    // Determinar si el desplazamiento táctil es suficiente para cambiar de sección
    if (Math.abs(currentY - this.touchStartY) > 50) {
      const direction = currentY < this.touchStartY ? 1 : -1;
      const newIndex = Math.min(Math.max(this.currentIndex + direction, 0), this.panels.length - 1);
      
      if (newIndex !== this.currentIndex) {
        this.scrollToPanel(newIndex);
        e.preventDefault();
      }
    }
  }
  
  // Variable para controlar el tiempo de transición (en milisegundos)
  private transitionTime = 1000; // Puedes cambiar este valor según prefieras: 500 (más rápido), 2000 (más lento)
  
  public scrollToPanel(index: number): void {
    if (this.isScrolling || index < 0 || index >= this.panels.length) return;
    
    this.isScrolling = true;
    this.currentIndex = index;
    
    // Actualizar clases para efectos visuales
    this.setActivePanel(index);
    
    // Actualizar los indicadores de navegación
    this.updateIndicators(index);
    
    // Scroll a la sección usando window.scrollTo para mayor control
    const targetPanel = this.panels[index];
    const rect = targetPanel.getBoundingClientRect();
    
    window.scrollTo({
      top: window.scrollY + rect.top,
      behavior: 'smooth'
    });
    
    // Disparar evento personalizado para el panel activo y permitir nuevo scroll después
    setTimeout(() => {
      this.isScrolling = false;
      this.triggerAnimationsForPanel(index);
    }, this.transitionTime);
  }
  
  private setActivePanel(index: number): void {
    this.panels.forEach((panel, i) => {
      if (i === index) {
        // Activar el panel actual
        panel.classList.add('active');
        panel.classList.add('animate'); // Esta clase activa las animaciones
      } else {
        // Desactivar los otros paneles
        panel.classList.remove('active');
        panel.classList.remove('animate');
      }
    });
    
    // Actualizar los indicadores de navegación
    this.updateIndicators(index);
  }
  
  /**
   * Activa animaciones específicas para cada panel
   * Nota: Las animaciones ahora están controladas directamente en el HTML
   * mediante las clases CSS (fade-in, bounce-in, etc.)
   */
  private triggerAnimationsForPanel(index: number): void {
    const panel = this.panels[index];
    if (!panel) return;
    
    // Simplemente añadimos la clase animate__animated a todos los elementos de animación
    // en el panel activo
    const animatedElements = panel.querySelectorAll('.animate__animated');
    
    console.log(`Activando ${animatedElements.length} animaciones en el panel ${index}`);
  }
  
  private updateIndicators(index: number): void {
    const indicators = document.querySelectorAll('.indicator');
    if (indicators && indicators.length > 0) {
      indicators.forEach((indicator, i) => {
        if (i === index) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
  }
  
  // Métodos públicos para navegación (opcional, para usar con botones)
  public goToNextSection(): void {
    if (this.currentIndex < this.panels.length - 1) {
      this.scrollToPanel(this.currentIndex + 1);
    }
  }
  
  public goToPrevSection(): void {
    if (this.currentIndex > 0) {
      this.scrollToPanel(this.currentIndex - 1);
    }
  }
  
  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    
    // Ya no necesitamos restaurar el overflow porque no lo cambiamos
    
    // Limpiar los event listeners
    window.removeEventListener('wheel', this.boundHandleScroll);
    window.removeEventListener('touchstart', this.boundHandleTouchStart);
    window.removeEventListener('touchmove', this.boundHandleTouchMove);
  }

}
