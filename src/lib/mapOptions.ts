export const opcionesMapa = {
    zoom: 13,
    center: { lat: 10.9961, lng: -63.7981 },
    // ESTO APAGA LOS ÍCONOS POR DEFECTO DE GOOGLE
    // Nota: Actualmente la app usa Leaflet con OpenStreetMap, por lo que estos estilos de Google Maps
    // no tendrán efecto visual en los mapas actuales, pero la configuración está lista si se migra a Google Maps.
    styles: [
        {
            featureType: "poi", // Puntos de interés (negocios, parques)
            elementType: "labels", // Las etiquetas e íconos
            stylers: [{ visibility: "off" }] // Ocultarlos
        },
        {
            featureType: "transit", // Paradas de autobús/metro
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
        }
    ]
};
