import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

import { SocketIoModule } from 'ngx-socket-io';
import { MapaComponent } from './components/mapa/mapa.component';
import { environment } from '../environments/environment.prod';

const config = environment.socketConfig;

@NgModule({
  declarations: [
    AppComponent,
    MapaComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
