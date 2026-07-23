// --- VARIABLES GLOBALES ---
let DEBUG = false;

let estado = "INICIO";
let canvasW, canvasH;
let fPosPlayer = 0.3; //factor sobre el ancho para posicionar el puntero del player

let modoRepetir = false; //alterna con un control en el player.
let CANT_VUELTAS = 4; //pasadas de la voz 1 para pasar a final (luego de terminar la voz 2)
let ESTADO_PLAY = "STOP";
//stop = detenido
//intro = solo intrumentos
//voz1 = solo voz uno en loop
//voz2 = dos voces en loop
//final = solo instrumentos al final.







// Objetos de Clases
let orbita;
let visor;
let faders = [];
let relFaders = [
    ["PEPE\n(NORTE)", "norte"],
    ["MELISA\n(SUR)", "sur"],
    ["CHELO", "chelo"],
    ["CLAVE", "clave"],
    ["CONTRABAJO", "contrabajo"],
    ["VIOLA", "viola"],
    ["VIOLÍN 1", "violin1"],
    ["VIOLÍN 2", "violin2"],
    ["CHELO", "chelo"]

]

let mezclador;
let player;

// Lista de archivos basada en tu lista
let archivosAudio = {
    norte: 'assets/audio/est_app_norte.m4a',
    sur: 'assets/audio/est_app_sur.mp3',
    //voz2: 'assets/audio/est_app_sur.mp3',
    //voz3: 'assets/audio/est_app_sur.mp3',

    chelo: 'assets/audio/est_app_chelo.mp3',
    clave: 'assets/audio/est_app_clave.mp3',
    contrabajo: 'assets/audio/est_app_contrabajo.mp3',
    viola: 'assets/audio/est_app_viola.mp3',
    violin1: 'assets/audio/est_app_violin_1.mp3',
    violin2: 'assets/audio/est_app_violin_2.mp3'
};


// t: tiempo de la canción (0.0 al inicio, 1.0 al final)
// t: Tiempo normalizado (0.0 a 1.0)
// x: Posición en píxeles medida en la imagen strip de 3200px
// CXX: Compás XX
// T1: Tiempo 1 (Inicio), T3: Tiempo 3 (Pulso medio)



//mapeo para ancho de compas UNIFORME
const MAPEO_LETRA_NORTE = [
    { t: 0.00000, x: 3200/2+16 },  // inicio
    { t: 1.00000, x: 3200/2+3200 + 22 },  // fin
]
const MAPEO_LETRA_SUR = [
    { t: 0.00000, x: 16 },  // inicio
    { t: 1.00000, x: 3200 + 22 },  // fin
]


/*
//mapeo para ancho de compas variable:

const MAPEO_LETRA_SUR = [
    // --- COMPÁS 1  (otoño) ---
    { t: 0.00000, x: 24 },  // C01-T1 (marzo)
    { t: 0.03125, x: 96 },  // C01-T3 (en "se")

    // --- COMPÁS 2  ---
    { t: 0.06250, x: 225 },  // C02-T1 (en "toño")
    { t: 0.09375, x: 295 },  // C02-T3 (en "con")

    // --- COMPÁS 3  ---
    { t: 0.12500, x: 374 },  // C03-T1 (en "tra")
    { t: 0.15625, x: 462 },  // C03-T3 (en "de_ho")

    // --- COMPÁS 4 ---
    { t: 0.18750, x: 594 },  // C04-T1 (en "y")
    { t: 0.21875, x: 665 },  // C04-T3 (en "-nio")

    // --- COMPÁS 5 (invierno) ---
    { t: 0.25000, x: 754 },  // C05-T1 (en "ju-")
    { t: 0.28125, x: 832 },  // C05-T3 (en "fri-")

    // --- COMPÁS 6  ---
    { t: 0.31250, x: 925 },  // C06-T1 (en "gris")
    { t: 0.34375, x: 1020 }, // C06-T3 (en "vi-")

    // --- COMPÁS 7  ---
    { t: 0.37500, x: 1157 }, // C07-T1 (en "-vier")
    { t: 0.40625, x: 1248 }, // C07-T3 (en "co-")

    // --- COMPÁS 8  ---
    { t: 0.43750, x: 1350 }, // C08-T1 (en "mu-")
    { t: 0.46875, x: 1468 }, // C08-T3 (en "nie-")


    // --- COMPÁS 9 PRIMAVERA ---
    { t: 0.50000, x: 1579 }, // C09-T1 y_en
    { t: 0.53125, x: 1709 }, // C09-T3 -ve-

    // --- COMPÁS 10 ---
    { t: 0.56250, x: 1843 }, // C10-T1 -na-
    { t: 0.59375, x: 1930 }, // C10-T3 -ran

    // --- COMPÁS 11 ---
    { t: 0.62500, x: 2042 }, // C11-T1 de
    { t: 0.65625, x: 2136 }, // C11-T3 -res

    // --- COMPÁS 12 ---
    { t: 0.68750, x: 2219 }, // C12-T1 y_ho
    { t: 0.71875, x: 2298 }, // C12-T3 ver-

    // --- COMPÁS 13 VERANO---
    { t: 0.75000, x: 2398 }, // C13-T1 sol
    { t: 0.78125, x: 2477 }, // C13-T3 -lor

    // --- COMPÁS 14 ---
    { t: 0.81250, x: 2559 }, // C14-T1 nos
    { t: 0.84375, x: 2674 }, // C14-T3 -ra-

    // --- COMPÁS 15 ---
    { t: 0.87500, x: 2769 }, // C15-T1 ro-
    { t: 0.90625, x: 2846 }, // C15-T3 -ten-

    // --- COMPÁS 16 ---
    { t: 0.93750, x: 2936 }, // C16-T1 de
    { t: 0.96875, x: 3068 }, // C16-T3 -du-

    // --- FINAL ---
    { t: 1.00000, x: 3200 + 24 }  // Borde final imagen
];
*/




//imagenes:
let letraNorteImg, letraSurImg;
let visorNorte, visorSur;
let imgArmadura, imgFundido;


p5.soundOut.adudeContext = null;


function preload() {

    stop();

    mezclador = new Mezclador();
    mezclador.cargar(archivosAudio);

    letraNorteImg = loadImage('assets/images/parte-norte.png');
    letraSurImg = loadImage('assets/images/parte-sur.png');
    //mismo para norte y sur:
    imgArmadura = loadImage('assets/images/armadura.png');
    imgFundido = loadImage('assets/images/fundido.png');

}



function setup() {

    actualizarDimensiones();
    createCanvas(canvasW, canvasH);

    pixelDensity(1);


    textAlign(CENTER, CENTER);

    // Inicializar Objetos según tus bloques %
    orbita = new OrbitalSystem(height * 0.1, height * 0.4);
    //visor = new LyricsViewer(height * 0.5, height * 0.2);

    // Crear faders distribuidos en el 30% inferior
    let fAnchoFader = 1 / relFaders.length;
    for (let i = 0; i < relFaders.length; i++) {
        let x = i * fAnchoFader + fAnchoFader / 2;
        //controla: 
        let nombreControla = relFaders[i][1];
        faders.push(new Fader(x, 0.7, fAnchoFader, 0.28, relFaders[i][0], nombreControla));
        //ajusta el volumen al valor del fader:
        mezclador.ajustarVolumen(nombreControla, faders[i].valor);



    }

    player = new ControladorPlayer(mezclador);

    //visor de letra:
    visorNorte = new MarqueeLyrics(letraNorteImg, MAPEO_LETRA_NORTE, height * 0.55, 80);
    visorSur = new MarqueeLyrics(letraSurImg, MAPEO_LETRA_SUR, height * 0.55 + 80, 80);


}


function draw() {
    background("#12151f");
    manejarEstados();
}

function manejarEstados() {
    switch (estado) {
        case "INICIO":
            dibujarPantallaInicio();
            break;
        case "JUGANDO":
            dibujarJugando();
            break;
        case "EXPLICACION":
            dibujarExplicacion();
            break;
    }
}

function dibujarJugando() {
    //background(20); // Fondo oscuro para que resalte la interfaz

    //chequea para cambiar esados del mezclador si está en intro:
    mezclador.actualizarFades(faders);
    mezclador.gestionarEstados();



    // 1. Bloque Menú (10%)
    fill(40);
    noStroke();
    rect(0, 0, width, height * 0.1);
    fill(255);
    textSize(14);
    text("MENÚ ☰", width * 0.15, height * 0.05);

    // 2. Bloque Órbita (40%)
    // Aquí pasaríamos el progreso real del audio (0.0 a 1.0)
    //let progresoSimulado = -(frameCount % 600) / 600;
    //angulo a partir de la posicion de la rotacion del track sur:
    let progreso = mezclador.getProgreso();

    //ORBITA:
    orbita.actualizar(progreso);
    orbita.dibujar();

    //LETRA:
    visorNorte.actualizar(progreso);
    visorNorte.dibujar();
    visorSur.actualizar(progreso);
    visorSur.dibujar();


    // 3. Bloque Visor de Letras (20%)
    //visor.dibujar("NORTE:como un muñeco de nieve...", "SUR: marzo se viste de otoño...");

    // 4. Bloque Faders (30%)
    faders.forEach(f => f.dibujar());

    // 5. Controlador player:
    player.dibujar();

    // --- CAPA DE DEBUG ---
    if (DEBUG) {
        mezclador.dibujarDebug();
    }
}

// --- INTERACCIÓN ---

function keyPressed() {
    if (key == 'd' || key == 'D') {
        DEBUG = !DEBUG;
    }
}


function mousePressed() {
    //console.log("mousePressed()");
    gestionarClicks(mouseX, mouseY);
}

function touchStarted() {
    //console.log("touchStarted()");
    gestionarClicks(touches[0].x, touches[0].y);
    return false; // Previene scroll en Android
}

async function gestionarClicks(mx, my) {
    // 1. DESPERTAR AUDIO (Crítico para Android/Chrome)
    if (getAudioContext().state !== 'running') {
        await userStartAudio();
    }

    // 2. LÓGICA DE ESTADOS
    if (estado == "INICIO") {
        // Colisión simple para el botón "COMENZAR" (que está en el centro)
        if (dist(mx, my, width / 2, height / 2) < 100) {
            estado = "JUGANDO";
        }
    }
    else if (estado == "JUGANDO") {
        // LE PASAMOS EL EVENTO AL PLAYER
        // Usamos el nombre que definiste en la clase: gestionarInteraccion
        player.gestionarInteraccion(mx, my);
    }
}

function mouseDragged() {
    if (estado === "JUGANDO") {

        // Permitir que los faders y pots reaccionen al arrastre
        faders.forEach(f => f.interactuar(mouseX, mouseY));
        //visor.nortePan.interactuar(mouseX, mouseY);
        //visor.surPan.interactuar(mouseX, mouseY);
    }
}

// --- CLASES ---

class OrbitalSystem {
    constructor(y, h) {
        this.y = y;
        this.h = h;
        this.angulo = 0;
        this.tamSol = 100;
        this.tamTierra = 80;
    }

    actualizar(progreso) {
        this.angulo = -progreso * TWO_PI + HALF_PI + PI * 0.125; //corrección para que marzo no sea exactamte 270º
    }

    dibujar() {
        push();
        translate(width / 2, this.y + this.h / 2);

        // 1. Órbita
        noFill(); stroke(60);
        ellipse(0, 0, width * 0.7, this.h * 0.6);

        // Posición de la Tierra
        let x = (width * 0.35) * cos(this.angulo);
        let y = (this.h * 0.3) * sin(this.angulo);

        // 2. Sol o Tierra segun posicion de rotacion (para pasar po detras)
        if (this.angulo > 0 || this.angulo < -PI) {
            this.dibujarSol();
            this.dibujarTierra(x, y);
        } else {
            this.dibujarTierra(x, y);
            this.dibujarSol();
        }
        //text(this.angulo, 150,100);


        pop();
    }

    dibujarSol() {
        fill(255, 200, 0); circle(0, 0, this.tamSol);
    }

    dibujarTierra(x, y) {
        // 4. Planeta Tierra
        fill(0, 150, 255);
        noStroke();
        circle(x, y, this.tamTierra);
        this.dibujarEje(x, y);

    }
    dibujarEje(x, y) {
        push();
        translate(x, y);
        // El eje siempre apunta a la misma dirección en el espacio
        // 23.5 grados es la inclinación real
        rotate(-radians(23.5));

        stroke(255, 150); // Blanco semitransparente
        strokeWeight(2);
        line(0, - this.tamTierra * 0.75, 0, this.tamTierra * 0.75); // Una línea que sobresale del círculo de la Tierra

        // Opcional: Una marquita para el Polo Norte
        //stroke(255, 0, 0);
        //point(0, -15);
        pop();
    }
}


class MarqueeLyrics {
    constructor(img, mapeo, y, h) {
        this.img = img;
        this.mapeo = mapeo;
        this.y = y;
        this.h = h;
        this.currentX = 0;
        this.escala = 1.0;
    }

    actualizar(progreso) {
        // 1. Forzamos límites para evitar errores de cálculo fuera de 0-1
        progreso = constrain(progreso, 0, 0.999);

        let p1, p2;

        // 2. Buscamos el segmento actual
        for (let i = 0; i < this.mapeo.length - 1; i++) {
            if (progreso >= this.mapeo[i].t && progreso < this.mapeo[i + 1].t) {
                p1 = this.mapeo[i];
                p2 = this.mapeo[i + 1];
                this.indiceActual = i; // Para debug
                if (DEBUG) {
                    text(nf(progreso, 1, 3), 20, 20);
                    text(this.indiceActual, 20, 40);
                }
                break;
            }
        }

        // 3. Si por alguna razón no encontró (ej. t=1.0), usamos los últimos
        if (!p1) {
            p1 = this.mapeo[this.mapeo.length - 2];
            p2 = this.mapeo[this.mapeo.length - 1];
            //console.log("no encontre punto");
        } else {
            //console.log("encontré" + p1.x)
        }

        // 4. Interpolación Lineal
        // Formula: $$amt = \frac{progreso - t_1}{t_2 - t_1}$$
        let amt = (progreso - p1.t) / (p2.t - p1.t);

        // Mapeamos los píxeles
        this.currentX = lerp(p1.x, p2.x, amt) - 3;

        // --- PRUEBA SIN INTERPOLACIÓN ---
        // En lugar de calcular el 'amt' y usar lerp(), asignamos directamente el x del punto
        //this.currentX = p1.x;
    }
    dibujar() {
        push();
        // Centramos el visor en el ancho de la ventana
        // Dibujamos la imagen desplazada por currentX
        // El "offset" width/2 es para que la palabra actual esté en el centro
        let offsetX = width * fPosPlayer - this.currentX*this.escala;


        image(this.img, offsetX, this.y, 3200*this.escala, this.h*this.escala);

        //duplica la imagen para lograr infinito DERECHA:
        if (offsetX + this.img.width < width) {
            image(this.img, offsetX + this.img.width*this.escala, this.y, 3200*this.escala, this.h*this.escala);
        }
        //duplica la imagen para lograr infinito IZQUIERDA:
        if (offsetX > 0) {
            image(this.img, offsetX - this.img.width*this.escala, this.y, 3200*this.escala, this.h*this.escala);
        }

        // Guía visual en fPosPlayer
        stroke(255, 204, 0);
        line(width * fPosPlayer, this.y-20, width * fPosPlayer, this.y + this.h+20);

        //si debuguea, muestra cada punto del mapeo:
        if (DEBUG) {
            push();
            translate(offsetX, this.y);
            for (let i = 0; i < this.mapeo.length; i++) {
                stroke(0, 255, 0, 100);
                line(this.mapeo[i].x, 0, this.mapeo[i].x, 0 + this.h);
                fill(0, 255, 0);
                textSize(10);
                text(nf(this.mapeo[i].t, 1, 3), this.mapeo[i].x, 0 + 10);

            }
            pop();

        }


        //la armadura a la izquierda y el fundido:
        image(imgArmadura, 0, this.y, imgArmadura.width*this.escala, imgArmadura.height*this.escala);
        push();
        translate(imgArmadura.width*this.escala, 0);
        image(imgFundido, 0, this.y, imgFundido.width*this.escala, imgFundido.height*this.escala);
        scale(-1, 1);
        //image(imgFundido, 0, this.y);
        pop();
        pop();

    }

}



class LyricsViewer {
    constructor(y, h) {
        this.y = y; this.h = h;
        this.nortePan = new Pot(width * 0.15, y + h * 0.25, "PAN");
        this.surPan = new Pot(width * 0.15, y + h * 0.75, "PAN");
    }
    dibujar(txtN, txtS) {
        fill(30, 40, 60); rect(0, this.y, width, this.h);
        this.nortePan.dibujar();
        this.surPan.dibujar();
        fill(255); textSize(14); textAlign(LEFT, CENTER);
        text(txtN, width * 0.25, this.y + this.h * 0.25);
        text(txtS, width * 0.25, this.y + this.h * 0.75);
        textAlign(CENTER, CENTER);
    }
}

class Fader {
    constructor(fx, fy, fw, fh, nombre_, controla_) {
        this.fx = fx; this.fy = fy; this.fw = fw; this.fh = fh;
        this.nombre = nombre_;
        this.controla = controla_;
        this.valor = 0.25; // De 0 a 1
    }
    dibujar() {
        this.x = this.fx * width;
        this.y = this.fy * height;
        this.h = height * this.fh;
        this.w = width * this.fw;
        let sliderH = this.h * 0.6;
        let sliderY = this.y + (this.h - sliderH) / 2;
        stroke(100); line(this.x, sliderY, this.x, sliderY + sliderH);
        let pY = map(this.valor, 0, 1, sliderY + sliderH, sliderY);
        fill(255, 204, 0); circle(this.x, pY, 15);
        noStroke(); fill(200); textSize(10);
        text(this.nombre, this.x, this.y + this.h - 15);
    }
    interactuar(mx, my) {
        if (mx > this.x - 20 && mx < this.x + 20 && my > this.y && my < this.y + this.h) {
            let sliderH = this.h * 0.6;
            let sliderY = this.y + (this.h - sliderH) / 2;
            this.valor = constrain(map(my, sliderY + sliderH, sliderY, 0, 1), 0, 1);
            //ajusta el volumen de la pista:
            mezclador.ajustarVolumen(this.controla, this.valor);

        }
    }
}

class Pot {
    constructor(x, y, label) {
        this.x = x; this.y = y; this.label = label;
        this.valor = 0.5;
    }
    dibujar() {
        push(); translate(this.x, this.y);
        rotate(map(this.valor, 0, 1, -PI * 0.75, PI * 0.75));
        stroke(255); circle(0, 0, 20);
        line(0, 0, 0, -10);
        pop();
    }
    interactuar(mx, my) {
        if (dist(mx, my, this.x, this.y) < 20) {
            this.valor = constrain(this.valor + (pmouseY - mouseY) * 0.01, 0, 1);
        }
    }
}

// --- FUNCIONES DE SOPORTE (Ventana y Pantalla Inicio omitidas para brevedad, mantener las tuyas) ---
function windowResized() { actualizarDimensiones(); resizeCanvas(canvasW, canvasH); }
function actualizarDimensiones() {
    let ratio = 9 / 16;
    if (windowWidth / windowHeight > ratio) {
        canvasH = windowHeight; canvasW = windowHeight * ratio;
    } else {
        canvasW = windowWidth; canvasH = windowWidth / ratio;
    }

    //posiciona los elementos:

}

function dibujarPantallaInicio() {
    //background(50, 100, 150);
    fill(255); textSize(32); text("LAS ESTACIONES", width / 2, height * 0.4);
    rectMode(CENTER); rect(width / 2, height / 2, 200, 50, 10);
    fill(0); textSize(16); text("COMENZAR", width / 2, height / 2);
    rectMode(CORNER);
}

function dibujarExplicacion() { /* Tu código de explicación */ }


/**** MEZCLADOR: */
class Mezclador {

    constructor() {
        this.tracks = {};
        this.volsActuales = {}; // El volumen que está sonando ahora (para el fade)
        this.totalCargados = 0;
        this.listo = false;
        this.isPlaying = false;

        //para contar las vueltas:
        this.yaConto = false;
        this.vueltasVoz1 = 0;

        //progreso con variable, para devolver una valor aunque esté en pausa:
        this.progreso = 0;

        //tiene el estado de intro, bucle, final.
        this.estadoPlay = "STOP";

        this.fadeIn = 0;


    }

    cargar(lista) {
        for (let nombre in lista) {
            this.tracks[nombre] = loadSound(lista[nombre], () => {

                this.volsActuales[nombre] = 0;

                // Si es el track "sur" (que usamos de referencia), le asignamos el listener
                if (nombre === "sur") {
                    this.tracks[nombre].onended(() => {
                        this.finalizoSur();
                    });
                }

                // Si es el track "sur" (que usamos de referencia), le asignamos el listener
                if (nombre === "norte") {
                    this.tracks[nombre].onended(() => {
                        this.finalizoNorte();
                    });
                }
                if (nombre === "chelo") {
                    this.tracks[nombre].onended(() => {
                        this.finalizoChelo();
                    });
                }

                this.tracks[nombre].playMode('restart');

                this.totalCargados++;
                if (this.totalCargados === Object.keys(lista).length) {
                    this.listo = true;
                    console.log("Todos los audios sincronizados y listos");
                }


            });
        }
    }



    reproducirTodo() {




        if (this.listo) {




            for (let nombre in this.tracks) {
                // las intros
                let offsetIni = 0;
                if (nombre === "norte") {
                    offsetIni = this.tracks[nombre].duration() * 1 / 16 * 8;

                }
                //play(startTime, rate, amp, loopStart, duration);
                this.tracks[nombre].loop(0, 1, 0, offsetIni);


            }




            this.isPlaying = true;
        }
    }


    alternarPlaying() {

        if (this.isPlaying) {
            this.pausarTodo();
        } else {
            this.reproducirTodo();
        }
    }


    ajustarVolumen(nombre, valor) {
        if (this.tracks[nombre]) {
            this.tracks[nombre].setVolume(valor);
        }
    }

    ajustarPan(nombre, valor) {
        if (this.tracks[nombre]) {
            this.tracks[nombre].pan(map(valor, 0, 1, -1, 1));
        }
    }

    getProgreso() {
        // Usamos sur como referencia de tiempo para la órbita
        // devuelve la posicion normalizada en 1
        if (this.listo && this.tracks.sur.isPlaying()) {
            this.progreso = this.tracks.sur.currentTime() / this.tracks.sur.duration();
        }
        return this.progreso;

    }

    actualizarFades(listaFaders) {

        for (let nombre in this.tracks) {
            // Buscamos el fader correspondiente dentro de la lista recibida
            let faderObj = listaFaders.find(f => f.controla === nombre);

            if (faderObj) {
                let volObjetivo = faderObj.valor;
                //console.log("encontre" + volObjetivo);

                // Suavizado (Lerp)
                // volsActuales[nombre] debe estar definido en el constructor
                this.volsActuales[nombre] = lerp(this.volsActuales[nombre], volObjetivo, 0.05);

                // Aplicamos al track de p5.js
                this.tracks[nombre].setVolume(this.volsActuales[nombre]);
            }
        }
    }
    obtenerVolumenDeFader(nombreTrack) {
        let fader = faders.find(f => f.controla === nombreTrack);
        return fader ? fader.valor : 0.5;
    }
    gestionarEstados() {
        //este metodo se llama desde el draw, para saber que tiene que reproducir segun
        //ajusta volumen para fadeIn FadeOut:


        //su estadoPlay y loop/noLoop
        switch (this.estadoPlay) {
            case "INTRO":
                //se fija si ya completo la intro, para cambiar estado e iniciar VOZ1
                //usa un instrumento:

                break;
            case "VOZ1":
                break;
            case "FINAL":
                break;

        }
    }

    dibujarDebug() {
        if (!this.listo) return;

        let nombres = Object.keys(this.tracks);
        let altoBarra = 10;
        let margen = 2;

        push();
        fill(0, 255, 0);
        textAlign(LEFT);
        text("estadoPlay: " + this.estadoPlay, 4, height * 0.1 + 10);
        // Lo ubicamos justo debajo del menú (al 10% del alto)
        translate(0, height * 0.1 + 20);

        nombres.forEach((nombre, i) => {
            let track = this.tracks[nombre];
            let progreso = 0;

            if (track.isPlaying() || track.isPaused()) {
                progreso = track.currentTime() / track.duration();
            }

            // Fondo de la barra (gris oscuro)
            fill(50, 200);
            noStroke();
            rect(0, i * (altoBarra + margen), width, altoBarra);

            // Barra de progreso (Verde flúo para debug)
            fill(0, 255, 100);
            let posProgreso = progreso * width;
            rect(posProgreso, i * (altoBarra + margen), altoBarra, altoBarra);

            // Nombre del track
            fill(255);
            textSize(8);
            textAlign(LEFT, CENTER);
            text(nombre.toUpperCase(), 4, i * (altoBarra + margen) + altoBarra / 2);
        });
        pop();
    }

    pausarTodo() {
        console.log("pause..");
        for (let nombre in this.tracks) {
            //todos los sonidos al tiempo de sur:

            this.tracks[nombre].stop(); // Usamos pause() para que mantenga la posición

        }
        this.isPlaying = false;
    }

    detenerTodo() {
        for (let nombre in this.tracks) {
            this.tracks[nombre].stop(); // stop() resetea el tiempo a 0
        }
        this.estadoPlay = "STOP";
        this.isPlaying = false;
        this.progreso = 0;
        this.yaConto = false;
        this.vueltasVoz1 = 0;

    }

    setLoop(bool) {
        for (let nombre in this.tracks) {
            this.tracks[nombre].setLoop(bool);
        }
    }

    finalizoNorte() {
        //console.log("FINALIZO NORTE");
    }
    finalizoSur() {
        //console.log("FINALIZO SUR");
    }
    finalizoChelo() {
        //console.log("FINALIZO CHELO");
        //si esta en intro inicia todos con voz1 (menos norte):


    }
}



class ControladorPlayer {
    constructor(mezclador) {
        this.mezclador = mezclador;
        this.y = height * 0.5; // 50% del alto
        this.altoFranja = height * 0.05; // El 5% de margen (40% al 45%)
        this.tamBtn = 45;
        this.espaciado = 70;

        this.loopActivo = false;
        this.estado = "STOP"; // "STOP", "PLAYING", "PAUSED"

        // Definimos las posiciones X de los botones
        this.btnStopX = width / 2 - this.espaciado;
        this.btnPlayX = width / 2;
        this.btnLoopX = width / 2 + this.espaciado;
    }

    dibujar() {
        push();
        rectMode(CENTER);
        textAlign(CENTER, CENTER);
        noStroke();
        textSize(10);

        // --- BOTÓN STOP ---
        //this._dibujarBoton(this.btnStopX, this.y, "STOP", this.estado === "STOP" ? '#666' : '#333');

        // --- BOTÓN PLAY/PAUSA ---
        let colorPlay = this.estado === "PLAYING" ? '#2ecc71' : '#444';
        let txtPlay = this.estado === "PLAYING" ? "STOP" : "PLAY";
        this._dibujarBoton(this.btnPlayX, this.y, txtPlay, colorPlay);

        // --- BOTÓN REPETIR ---
        /*
        let colorLoop = this.loopActivo ? '#3498db' : '#333';
        let txtLoop = this.loopActivo ? "LOOP: ON" : "LOOP: OFF";
        this._dibujarBoton(this.btnLoopX, this.y, txtLoop, colorLoop);
        */
       pop();
    }

    _dibujarBoton(x, y, txt, col) {
        fill(col);
        rect(x, y, this.tamBtn + 10, this.tamBtn - 10, 5);
        fill(255);
        text(txt, x, y);
    }

    async gestionarInteraccion(mx, my) {
        // Validar si el clic está en la franja de altura correcta para ahorrar cálculos
        //if (my < height * 0.40 || my > height * 0.45) return;

        // Despertar audio para Android (Solución addModule)
        if (getAudioContext().state !== 'running') {
            await userStartAudio();
        }

        // Lógica de colisión simple por cercanía en X
        if (dist(mx, my, this.btnStopX, this.y) < this.tamBtn / 2) {
            this.clickStop();
        } else if (dist(mx, my, this.btnPlayX, this.y) < this.tamBtn / 2) {
            this.clickPlay();
        } else if (dist(mx, my, this.btnLoopX, this.y) < this.tamBtn / 2) {
            this.clickLoop();
        }
    }

    clickStop() {
        this.estado = "STOP";
        this.mezclador.detenerTodo(); // Asegúrate que tu mezclador tenga este método
    }

    clickPlay() {
        //console.log("click en play");

        if (this.estado === "PLAYING") {
            this.estado = "PAUSED";
            this.mezclador.pausarTodo();
        } else {
            this.estado = "PLAYING";
            this.mezclador.reproducirTodo();
        }
    }

    clickLoop() {
        this.loopActivo = !this.loopActivo;
        // Aplicar a cada track del mezclador
        this.mezclador.setLoop(this.loopActivo);
    }
}