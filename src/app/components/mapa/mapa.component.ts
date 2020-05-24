import { Lugar } from './../../Interfaces/interfaces';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Lugar } from 'src/app/Interfaces/interfaces';
import { WebsocketService } from './../../services/websocket.service';

import * as mapboxgl from 'mapbox-gl';


interface RespuestaMarcadores {
  [key:string]:Lugar
};


@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  mapa: mapboxgl.Map;
  lugares: RespuestaMarcadores = {};
  markersMapBox: {[id:string]:mapboxgl.Marker} = {};


  constructor(private http:HttpClient,private wsService:WebsocketService) { }

  ngOnInit(): void {
    this.http.get<RespuestaMarcadores>('http://localhost:5000/mapa').subscribe(lugares=>{
      this.lugares = lugares;
      this.crearMapa();
    });
    this.escucharSockets();
  }

  escucharSockets(){
    //crear un nuevo marcador
    this.wsService.listen('marcador-backend-nuevo').subscribe((marcador:Lugar)=>this.agregarMarcador(marcador));
    //marcador-mover
    this.wsService.listen('marcador-backend-mover').subscribe((marcador:Lugar) =>{
      this.markersMapBox[marcador.id].setLngLat([marcador.lng,marcador.lat]);
    });

    //marcador-borrar
    this.wsService.listen('marcador-backend-borrar').subscribe((id:string)=>{
      this.markersMapBox[id].remove();
      //borrar dentro del objeto
      delete this.markersMapBox[id];
    });
  }

  crearMapa(){

    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiY2hyaXN0aWFuY3J1ejE5OTEiLCJhIjoiY2p3YTRiYnN1MDY0ODQzbTFwbjczajhreiJ9.2ei9UFGdy529EY84FoE44A';

    this.mapa =  new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center:[-76.528182,3.47642885],
      zoom:15.8
    });

    //object.entries se utiliza para barre un objeto y el resultado es un arreglo de dicho objeto
    //[id,marcador] destructuracion de la respuesta de un arreglo
    for (const [id,marcador] of Object.entries(this.lugares)) {
       this.agregarMarcador(marcador);
    }
  }

  agregarMarcador(marcador:Lugar){

    const h2 = document.createElement('h2');
    h2.innerText = marcador.nombre;

    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.append(h2,btnBorrar);
    //para mostrar la info arriba del marcador
    /*const html = `<h2>${marcador.nombre}</h2>
                  <br>
                  <button>Borrar</button>`;*/

    //agregarlo el popup al marcador que tenemos en el mapa
    const customPopup = new mapboxgl.Popup({
      //la distancia del popup con el marcador
      offset:25,
      //para que no se cierre al hacer click en cual quier lado del mapa
      closeOnClick:false
    }).setDOMContent(div);

    const marker = new mapboxgl.Marker({
      //que se puede mover
      draggable:true,
      color:marcador.color,
    })
    .setPopup(customPopup)
    .setLngLat([marcador.lng,marcador.lat])
    .addTo(this.mapa);

    //esta funcion viene directamente desde el mapbox
    marker.on('drag',()=>{
      //obtener la lat y lng de un marker desde el mapa
      const lngLat = marker.getLngLat();
      //TODO:crear evento para emitir las coordenadas de este marcador
      const nuevoMarcador = {
        id:marcador.id,
        ...lngLat
      }
      this.wsService.emit('marcador-mover',nuevoMarcador);

    });

    //funcion cuando se da click
    btnBorrar.addEventListener('click',()=>{
       //eliminar un marcador desde el botton eliminar
      marker.remove();
      //Eliminar el marcador mediante sockets
      this.wsService.emit('marcador-borrar',marcador.id);
    });

    this.markersMapBox[marcador.id] = marker;

  }

  crearMarcador(){

    const customMarker:Lugar ={
      id:new Date().toISOString(),
      lng: -76.528182,
      lat: 3.47642885,
      nombre:'Sin Nombre',
      //colocar colores aleatorios
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    this.agregarMarcador(customMarker);

    //emitir marcador-nuevo al servidor de sockets
    this.wsService.emit('marcador-nuevo',customMarker);

  }

}
