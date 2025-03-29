import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-circut-game',
  templateUrl: './circut-game.component.html',
  styleUrls: ['./circut-game.component.scss'],
  imports: [MatButtonModule, MenuComponent],
})
export class CircutGameComponent implements AfterViewInit {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private points: { x: number; y: number }[] = [];

  isGameStarted = false;
  accuracy: number | null = null;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
  }

  startGame() {
    this.isGameStarted = true;
    this.accuracy = null;
    this.points = [];
    this.clearCanvas();
    this.setupEventListeners();
  }

  private clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private setupEventListeners() {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
  }

  private startDrawing(e: MouseEvent) {
    if (!this.isGameStarted) return;

    this.isDrawing = true;
    const point = this.getMousePosition(e);
    this.points.push(point);

    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing || !this.isGameStarted) return;

    const point = this.getMousePosition(e);
    this.points.push(point);

    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  private stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.calculateAccuracy();
    this.isGameStarted = false;
  }

  private getMousePosition(e: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private calculateAccuracy() {
    if (this.points.length < 10) {
      this.accuracy = 0;
      return;
    }

    // Calculate center point
    const center = this.calculateCenter();

    // Calculate average radius
    const avgRadius = this.calculateAverageRadius(center);

    // Calculate how much each point deviates from perfect circle
    const deviations = this.points.map((p) => {
      const actualRadius = Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));
      return Math.abs(actualRadius - avgRadius) / avgRadius; // Normalize by radius
    });

    // Calculate average deviation (as percentage of radius)
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

    // Calculate standard deviation to detect outliers
    const stdDeviation = Math.sqrt(deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / deviations.length);

    // Calculate circularity score (lower deviation = higher accuracy)
    // Perfect circle would have 0 deviation
    const circularityScore = Math.max(0, 100 - avgDeviation * 100 * 3 - stdDeviation * 100 * 2);

    // Shape score - check if the shape is actually closed (first point near last point)
    let closednessScore = 100;
    if (this.points.length > 20) {
      const firstPoint = this.points[0];
      const lastPoint = this.points[this.points.length - 1];
      const distance = Math.sqrt(Math.pow(firstPoint.x - lastPoint.x, 2) + Math.pow(firstPoint.y - lastPoint.y, 2));

      // If distance between first and last points is more than 20% of radius, reduce score
      if (distance > avgRadius * 0.2) {
        closednessScore = Math.max(0, 100 - (distance / avgRadius) * 100);
      }
    }

    // Combine scores, with more weight on circularity
    const finalScore = circularityScore * 0.8 + closednessScore * 0.2;

    this.accuracy = Math.round(Math.min(100, Math.max(0, finalScore)));

    console.log({
      points: this.points.length,
      avgRadius,
      avgDeviation: avgDeviation.toFixed(4),
      stdDeviation: stdDeviation.toFixed(4),
      circularityScore: circularityScore.toFixed(2),
      closednessScore: closednessScore.toFixed(2),
      finalScore: finalScore.toFixed(2),
    });
  }

  private calculateCenter() {
    const sumX = this.points.reduce((sum, p) => sum + p.x, 0);
    const sumY = this.points.reduce((sum, p) => sum + p.y, 0);
    return {
      x: sumX / this.points.length,
      y: sumY / this.points.length,
    };
  }

  private calculateAverageRadius(center: { x: number; y: number }) {
    return (
      this.points.reduce((sum, p) => {
        return sum + Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));
      }, 0) / this.points.length
    );
  }
}
