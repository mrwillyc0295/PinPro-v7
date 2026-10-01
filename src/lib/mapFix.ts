import L from 'leaflet';

// Global fix for Leaflet error: "Cannot read properties of undefined (reading '_leaflet_pos')"
// This error often happens in React-Leaflet when markers are removed during animations or transitions.

const originalGetPosition = L.DomUtil.getPosition;
L.DomUtil.getPosition = function (el: HTMLElement) {
    if (!el || typeof el !== 'object') return new L.Point(0, 0);
    try {
        return originalGetPosition(el);
    } catch (e) {
        return new L.Point(0, 0);
    }
};

const originalSetPosition = L.DomUtil.setPosition;
L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
    if (!el || typeof el !== 'object') return;
    try {
        originalSetPosition(el, point);
    } catch (e) {
        // Suppress
    }
};

// Also patch Marker onRemove to be more defensive
const originalMarkerOnRemove = L.Marker.prototype.onRemove;
L.Marker.prototype.onRemove = function (map: L.Map) {
    if (!this._icon) {
        // If icon is already gone, skip some internal teardown that might crash
        try {
            return originalMarkerOnRemove.call(this, map);
        } catch (e) {
            console.warn("Leaflet: suppressed crash in Marker.onRemove", e);
            return this;
        }
    }
    return originalMarkerOnRemove.call(this, map);
};

// Patch Popup to avoid crashing if it's opened on a marker that's about to be removed
const originalPopupOnAdd = L.Popup.prototype.onAdd;
L.Popup.prototype.onAdd = function (map: L.Map) {
    try {
        return originalPopupOnAdd.call(this, map);
    } catch (e) {
        console.warn("Leaflet: suppressed crash in Popup.onAdd", e);
        return this;
    }
};
