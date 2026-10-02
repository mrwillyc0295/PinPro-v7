import React, { ReactNode } from 'react';
import {
  Droplets, Lightbulb, Thermometer, Key, HardHat, Hammer, Plus, Activity,
  Brain, Apple, Scissors, Sparkles, Cpu, Smartphone, ShieldCheck, Wifi,
  Code, Palette, Share2 as ShareIcon, Wrench, Truck, Bike, Package, Car,
  Camera, Music, Languages, Calculator, Building2, Scale, FileText, Ship,
  Baby, Shirt, Waves, Wind, Dog, Microscope, Syringe, Wand2, UserRound,
  WashingMachine, MapPin, Briefcase, Paintbrush
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../constants/services';

export const PROFESSION_ICON_MAP: Record<string, ReactNode> = {
  "plomero": <Droplets className="w-full h-full" />,
  "fontanero": <Droplets className="w-full h-full" />,
  "tubería": <Droplets className="w-full h-full" />,
  "agua": <Droplets className="w-full h-full" />,
  "electricista": <Lightbulb className="w-full h-full" />,
  "electricidad": <Lightbulb className="w-full h-full" />,
  "luz": <Lightbulb className="w-full h-full" />,
  "aire": <Thermometer className="w-full h-full" />,
  "refrigeración": <Thermometer className="w-full h-full" />,
  "cerrajero": <Key className="w-full h-full" />,
  "albañil": <HardHat className="w-full h-full" />,
  "construcción": <HardHat className="w-full h-full" />,
  "pintor": <Paintbrush className="w-full h-full" />,
  "pintura": <Paintbrush className="w-full h-full" />,
  "carpintero": <Hammer className="w-full h-full" />,
  "madera": <Hammer className="w-full h-full" />,
  "médico": <Plus className="w-full h-full stroke-[4px]" />,
  "doctor": <Plus className="w-full h-full stroke-[4px]" />,
  "pediatra": <Plus className="w-full h-full stroke-[4px]" />,
  "ginecólogo": <Plus className="w-full h-full stroke-[4px]" />,
  "enfermero": <Plus className="w-full h-full stroke-[4px]" />,
  "cuidador": <Plus className="w-full h-full stroke-[4px]" />,
  "odontólogo": <Plus className="w-full h-full stroke-[4px]" />,
  "dental": <Plus className="w-full h-full stroke-[4px]" />,
  "holística": <Plus className="w-full h-full stroke-[4px]" />,
  "fisioterapeuta": <Activity className="w-full h-full" />,
  "rehabilitador": <Activity className="w-full h-full" />,
  "psicólogo": <Brain className="w-full h-full" />,
  "nutricionista": <Apple className="w-full h-full" />,
  "dieta": <Apple className="w-full h-full" />,
  "peluquero": <Scissors className="w-full h-full" />,
  "estilista": <Scissors className="w-full h-full" />,
  "barbero": <Scissors className="w-full h-full" />,
  "manicurista": <Sparkles className="w-full h-full" />,
  "lashista": <Sparkles className="w-full h-full" />,
  "maquillador": <Sparkles className="w-full h-full" />,
  "tecnología": <Cpu className="w-full h-full" />,
  "computadoras": <Cpu className="w-full h-full" />,
  "it": <Cpu className="w-full h-full" />,
  "celulares": <Smartphone className="w-full h-full" />,
  "tablets": <Smartphone className="w-full h-full" />,
  "cámaras": <ShieldCheck className="w-full h-full" />,
  "seguridad": <ShieldCheck className="w-full h-full" />,
  "cctv": <ShieldCheck className="w-full h-full" />,
  "redes": <Wifi className="w-full h-full" />,
  "internet": <Wifi className="w-full h-full" />,
  "antenas": <Wifi className="w-full h-full" />,
  "desarrollador": <Code className="w-full h-full" />,
  "web": <Code className="w-full h-full" />,
  "app": <Code className="w-full h-full" />,
  "software": <Code className="w-full h-full" />,
  "diseñador": <Palette className="w-full h-full" />,
  "gráfico": <Palette className="w-full h-full" />,
  "marketing": <ShareIcon className="w-full h-full" />,
  "community": <ShareIcon className="w-full h-full" />,
  "mecánico": <Wrench className="w-full h-full" />,
  "frenos": <Wrench className="w-full h-full" />,
  "grúa": <Truck className="w-full h-full" />,
  "transporte": <Truck className="w-full h-full" />,
  "fletes": <Truck className="w-full h-full" />,
  "moto taxi": <Bike className="w-full h-full" />,
  "mototaxi": <Bike className="w-full h-full" />,
  "delivery": <Package className="w-full h-full" />,
  "mensajería": <Package className="w-full h-full" />,
  "repartidor": <Package className="w-full h-full" />,
  "chofer": <Car className="w-full h-full" />,
  "taxi": <Car className="w-full h-full" />,
  "vehículo": <Car className="w-full h-full" />,
  "fotógrafo": <Camera className="w-full h-full" />,
  "videógrafo": <Camera className="w-full h-full" />,
  "dj": <Music className="w-full h-full" />,
  "músico": <Music className="w-full h-full" />,
  "banda": <Music className="w-full h-full" />,
  "idiomas": <Languages className="w-full h-full" />,
  "traductor": <Languages className="w-full h-full" />,
  "contador": <Calculator className="w-full h-full" />,
  "administrador": <Calculator className="w-full h-full" />,
  "abogado": <Scale className="w-full h-full" />,
  "legal": <Scale className="w-full h-full" />,
  "notario": <Scale className="w-full h-full" />,
  "arquitecto": <Building2 className="w-full h-full" />,
  "ingeniero": <Building2 className="w-full h-full" />,
  "gestor": <FileText className="w-full h-full" />,
  "trámites": <FileText className="w-full h-full" />,
  "marítimo": <Ship className="w-full h-full" />,
  "pesca": <Ship className="w-full h-full" />,
  "niñera": <Baby className="w-full h-full" />,
  "bebe": <Baby className="w-full h-full" />,
  "costurera": <Shirt className="w-full h-full" />,
  "sastre": <Shirt className="w-full h-full" />,
  "piscina": <Waves className="w-full h-full" />,
  "alberca": <Waves className="w-full h-full" />,
  "aire acondicionado": <Wind className="w-full h-full" />,
  "veterinario": <Dog className="w-full h-full" />,
  "mascotas": <Dog className="w-full h-full" />,
  "laboratorio": <Microscope className="w-full h-full" />,
  "exámenes": <Microscope className="w-full h-full" />,
  "vacunador": <Syringe className="w-full h-full" />,
  "mago": <Wand2 className="w-full h-full" />,
  "animador": <UserRound className="w-full h-full" />,
  "lavandería": <WashingMachine className="w-full h-full" />,
};

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getProfessionIcon = (profession: string) => {
  const p = profession?.toLowerCase() || "";
  for (const [key, icon] of Object.entries(PROFESSION_ICON_MAP)) {
    if (p.includes(key)) return icon;
  }
  return <Briefcase className="w-full h-full" />;
};

export const getCategoryForProfession = (profession: string) => {
  for (const cat of SERVICE_CATEGORIES) {
    if (cat.services.includes(profession)) {
      return cat.title;
    }
  }
  return "Otros";
};
