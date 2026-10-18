import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection(),
        provideHttpClient() // Add it here
    ]
}).catch((err) => console.error(err));
