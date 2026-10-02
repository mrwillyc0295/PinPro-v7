import {
  Wrench, Stethoscope, Scissors, MonitorSmartphone, Car, Camera, BookOpen, Briefcase,
  Dog, WashingMachine, Bike, Package, Activity, Cpu, Shield, Wifi, Code, Palette,
  Gamepad2, Printer, Truck, Music, Calculator, Building2, Scale, FileText, Ship,
  Baby, Shirt, Waves, Lightbulb, Wind, Syringe, Wand2, UserRound, Microscope,
  Brain, Apple, HardHat, Droplets, Hammer, Paintbrush, Dog as DogIcon, Plus, Key, Thermometer, Trash2,
  Sparkles, Smartphone, ShieldCheck, Share, Languages
} from 'lucide-react';

export const getProfessionIcon = (profession: string) => {
  const p = profession?.toLowerCase() || '';
  if (p.includes('plomero') || p.includes('fontanero') || p.includes('tubería') || p.includes('agua')) return <Droplets className="w-full h-full" />;
  if (p.includes('electricista') || p.includes('electricidad') || p.includes('luz')) return <Lightbulb className="w-full h-full" />;
  if (p.includes('aire') || p.includes('refrigeración')) return <Thermometer className="w-full h-full" />;
  if (p.includes('cerrajero')) return <Key className="w-full h-full" />;
  if (p.includes('albañil') || p.includes('construcción')) return <HardHat className="w-full h-full" />;
  if (p.includes('pintor') || p.includes('pintura')) return <Paintbrush className="w-full h-full" />;
  if (p.includes('carpintero') || p.includes('madera')) return <Hammer className="w-full h-full" />;
  if (p.includes('médico') || p.includes('doctor') || p.includes('pediatra') || p.includes('ginecólogo') || p.includes('enfermero') || p.includes('cuidador') || p.includes('odontólogo') || p.includes('dental') || p.includes('holística')) return <Plus className="w-full h-full stroke-[4px]" />;
  if (p.includes('fisioterapeuta') || p.includes('rehabilitador')) return <Activity className="w-full h-full" />;
  if (p.includes('psicólogo')) return <Brain className="w-full h-full" />;
  if (p.includes('nutricionista') || p.includes('dieta') || p.includes('holística')) return <Apple className="w-full h-full" />;
  if (p.includes('peluquero') || p.includes('estilista') || p.includes('barbero')) return <Scissors className="w-full h-full" />;
  if (p.includes('manicurista') || p.includes('lashista') || p.includes('maquillador')) return <Sparkles className="w-full h-full" />;
  if (p.includes('tecnología') || p.includes('computadoras') || p.includes('it')) return <Cpu className="w-full h-full" />;
  if (p.includes('celulares') || p.includes('tablets')) return <Smartphone className="w-full h-full" />;
  if (p.includes('cámaras') || p.includes('seguridad') || p.includes('cctv')) return <ShieldCheck className="w-full h-full" />;
  if (p.includes('redes') || p.includes('internet') || p.includes('antenas')) return <Wifi className="w-full h-full" />;
  if (p.includes('desarrollador') || p.includes('web') || p.includes('app') || p.includes('software')) return <Code className="w-full h-full" />;
  if (p.includes('diseñador') || p.includes('gráfico')) return <Palette className="w-full h-full" />;
  if (p.includes('marketing') || p.includes('community')) return <Share className="w-full h-full" />;
  if (p.includes('mecánico') || p.includes('frenos')) return <Wrench className="w-full h-full" />;
  if (p.includes('grúa') || p.includes('transporte') || p.includes('fletes')) return <Truck className="w-full h-full" />;
  if (p.includes('moto taxi') || p.includes('mototaxi')) return <Bike className="w-full h-full" />;
  if (p.includes('delivery') || p.includes('mensajería') || p.includes('repartidor')) return <Package className="w-full h-full" />;
  if (p.includes('chofer') || p.includes('taxi') || p.includes('vehículo')) return <Car className="w-full h-full" />;
  if (p.includes('fotógrafo') || p.includes('videógrafo')) return <Camera className="w-full h-full" />;
  if (p.includes('dj') || p.includes('músico') || p.includes('banda')) return <Music className="w-full h-full" />;
  if (p.includes('idiomas') || p.includes('traductor')) return <Languages className="w-full h-full" />;
  if (p.includes('tutor') || p.includes('profesor') || p.includes('académico')) return <BookOpen className="w-full h-full" />;
  if (p.includes('abogado') || p.includes('legal')) return <Scale className="w-full h-full" />;
  if (p.includes('contador') || p.includes('finanzas')) return <Calculator className="w-full h-full" />;
  if (p.includes('inmobiliario') || p.includes('arquitecto')) return <Building2 className="w-full h-full" />;
  if (p.includes('fumigador')) return <Wind className="w-full h-full" />;
  if (p.includes('limpieza')) return <Trash2 className="w-full h-full" />;
  if (p.includes('jardinero') || p.includes('paisajista')) return <Waves className="w-full h-full" />;
  if (p.includes('niñera') || p.includes('babysitter')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M8 10h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10z" />
      <rect x="9" y="7" width="6" height="3" rx="1" />
    </svg>
  );
  return <Wrench className="w-full h-full" />;
};
