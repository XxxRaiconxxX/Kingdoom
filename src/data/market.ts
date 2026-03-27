import { Gem, Shield, Sparkles, Sword } from "lucide-react";
import type { MarketCategory, MarketItem } from "../types";

export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    id: "potions",
    title: "Pociones",
    subtitle: "Breves ventajas en combate, viajes y rituales.",
    icon: Sparkles,
  },
  {
    id: "armors",
    title: "Armaduras",
    subtitle: "Proteccion para campeones, guardianes y exploradores.",
    icon: Shield,
  },
  {
    id: "swords",
    title: "Espadas",
    subtitle: "Acero comun, reliquias nobles y hojas malditas.",
    icon: Sword,
  },
  {
    id: "others",
    title: "Otros",
    subtitle: "Objetos curiosos, suministros y amuletos de ocasion.",
    icon: Gem,
  },
];

export const MARKET_ITEMS: MarketItem[] = [
  {
    category: "potions",
    name: "Pocion de Niebla Roja",
    description:
      "Aumenta la evasion en una escena y deja un aroma a hierro viejo.",
    ability:
      "Niebla evasiva: permite esquivar el primer ataque directo o salir de una emboscada con cobertura narrativa.",
    price: 180,
    rarity: "rare",
    stockStatus: "available",
    featured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "potions",
    name: "Elixir del Cuervo",
    description:
      "Recupera fuerzas tras una expedicion y mejora tiradas de percepcion.",
    ability:
      "Ojo del cuervo: otorga ventaja para detectar trampas, rastros o traiciones durante una escena.",
    price: 320,
    rarity: "epic",
    stockStatus: "limited",
    imageUrl:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "armors",
    name: "Coraza del Bastion Negro",
    description:
      "Armadura pesada que absorbe el primer impacto serio de un duelo.",
    ability:
      "Muro de hierro: reduce una herida grave a herida media una vez por combate oficial.",
    price: 940,
    rarity: "epic",
    stockStatus: "limited",
    imageUrl:
      "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "armors",
    name: "Manto del Vigia Gris",
    description:
      "Defensa ligera para patrullas nocturnas y misiones de sigilo.",
    ability:
      "Paso velado: mejora infiltracion y tiradas de vigilancia en terreno urbano o fronterizo.",
    price: 410,
    rarity: "common",
    stockStatus: "available",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "swords",
    name: "Espada del Eclipse",
    description:
      "Hoja maldita capaz de ignorar armaduras comunes y sembrar miedo.",
    ability:
      "Sombra cortante: el primer golpe exitoso del duelo impone temor o retroceso al rival.",
    price: 1250,
    rarity: "legendary",
    stockStatus: "limited",
    featured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "swords",
    name: "Sable de la Marca Ceniza",
    description:
      "Acero rapido con bonificacion narrativa en persecuciones y duelos.",
    ability:
      "Marca ardiente: si hiere primero, gana prioridad en persecuciones o intercambios rapidos.",
    price: 560,
    rarity: "rare",
    stockStatus: "available",
    imageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "others",
    name: "Sello de Obsidiana",
    description:
      "Amuleto de linaje oscuro que protege de maldiciones durante una escena.",
    ability:
      "Velo de obsidiana: anula una maldicion menor o ritual hostil una vez por escena.",
    price: 780,
    rarity: "epic",
    stockStatus: "available",
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "others",
    name: "Raciones del Camino Gris",
    description:
      "Suministros basicos para viajes largos, asedios y expediciones nocturnas.",
    ability:
      "Marcha austera: evita desgaste menor durante travesias largas o campañas de frontera.",
    price: 95,
    rarity: "common",
    stockStatus: "sold-out",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "swords",
    name: "Requiem del Sepulturero",
    description:
      "Hoja-mecanismo de acero funerario, forjada para duelistas que prefieren rematar a distancia corta.",
    ability:
      "Disparo ritual: una vez por escena puede romper cobertura ligera o obligar al rival a retroceder tras un impacto confirmado.",
    price: 1380,
    rarity: "legendary",
    stockStatus: "limited",
    featured: true,
    imageUrl:
      "https://i.pinimg.com/control1/736x/0b/d2/93/0bd293ecda955dc6fd62f1e12ea94731.jpg",
  },
  {
    category: "swords",
    name: "Mandoble de las Seis Brasas",
    description:
      "Espadon ceremonial con filo ancho y guardia infernal, pensado para abrir formaciones enemigas.",
    ability:
      "Carga de brasa: tras una preparacion breve, el siguiente golpe inflige un impacto devastador en asedios o choques frontales.",
    price: 980,
    rarity: "epic",
    stockStatus: "limited",
    imageUrl:
      "https://i.pinimg.com/control1/736x/03/66/b2/0366b2bc08564c5014a8307d6741a50b.jpg",
  },
  {
    category: "swords",
    name: "Aguja del Trono Vacio",
    description:
      "Espada refinada de perfil regio, apreciada por nobles caidos y asesinos de corte.",
    ability:
      "Puncion de precision: ignora escudos ligeros y concede ventaja narrativa en duelos de tecnica.",
    price: 760,
    rarity: "rare",
    stockStatus: "available",
    imageUrl:
      "https://i.pinimg.com/control1/736x/bb/1d/99/bb1d99ccef2d15e84f00a80bf72a2d03.jpg",
  },
  {
    category: "swords",
    name: "Filo del Peregrino Carmesi",
    description:
      "Hoja larga de viajero errante, marcada por campañas, juramentos y sangre de frontera.",
    ability:
      "Impulso del caminante: si conecta el primer ataque, gana ventaja en persecuciones, retiradas o reposicionamiento.",
    price: 840,
    rarity: "epic",
    stockStatus: "available",
    imageUrl:
      "https://i.pinimg.com/736x/ab/4e/96/ab4e96193aace3761e17f27dfff9d85a.jpg",
  },
  {
    category: "armors",
    name: "Armadura del Leon de Ceniza",
    description:
      "Armadura de pecho imponente, tallada para comandantes que deben sobrevivir a la primera linea.",
    ability:
      "Orgullo del leon: el primer golpe grave de la escena se reduce a daño moderado una vez por evento.",
    price: 1180,
    rarity: "epic",
    stockStatus: "limited",
    featured: true,
    imageUrl:
      "https://i.pinimg.com/736x/4f/2c/ad/4f2cad925b00704b8308fc8d28c1bf32.jpg",
  },
  {
    category: "armors",
    name: "Coraza de la Vigilia Escarlata",
    description:
      "Proteccion noble con remates rojos y presencia ceremonial para guardianes de alto rango.",
    ability:
      "Juramento escarlata: mejora resistencia a maldiciones, miedo y desgaste durante guardias nocturnas.",
    price: 860,
    rarity: "rare",
    stockStatus: "available",
    imageUrl:
      "https://i.pinimg.com/736x/de/51/b6/de51b6d4a895ff80c0cbdda7ec51ec47.jpg",
  },
  {
    category: "armors",
    name: "Placas del Custodio Celestial",
    description:
      "Armadura sagrada de silueta heroica, creada para custodios que deben proteger a toda costa.",
    ability:
      "Bastion de guardian: permite interceptar parte del daño o una maldicion dirigida a un aliado cercano.",
    price: 1290,
    rarity: "legendary",
    stockStatus: "limited",
    imageUrl:
      "https://i.pinimg.com/control1/736x/a8/fb/5c/a8fb5c3bce9b1344f58e9b398a0f60f0.jpg",
  },
];
