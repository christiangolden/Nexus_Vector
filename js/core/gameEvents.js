/**
 * Nexus Vector - Game Events
 * 
 * A simple publish/subscribe event system that allows game components to communicate
 * without direct references to each other. This reduces coupling between modules.
 */

const GameEvents = (function() {
    'use strict';
    
    // Event registry - stores all event subscribers
    const eventRegistry = {};
    
    /**
     * Subscribe to an event
     * @param {string} event - The event name to subscribe to
     * @param {Function} callback - The function to call when the event is published
     * @returns {Function} - Unsubscribe function
     */
    function subscribe(event, callback) {
        if (!eventRegistry[event]) {
            eventRegistry[event] = [];
        }
        
        // Add the callback to the event's subscribers
        eventRegistry[event].push(callback);
        
        // Return a function to unsubscribe
        return function unsubscribe() {
            const index = eventRegistry[event].indexOf(callback);
            if (index !== -1) {
                eventRegistry[event].splice(index, 1);
            }
        };
    }
    
    /**
     * Publish an event to all subscribers
     * @param {string} event - The event to publish
     * @param {any} data - Optional data to pass to subscribers
     */
    function publish(event, data) {
        if (!eventRegistry[event]) {
            return; // No subscribers for this event
        }
        
        // Create a copy of the subscribers array to prevent issues if callbacks modify the array
        const subscribers = [...eventRegistry[event]];
        
        // Call each subscriber with the event data
        subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event subscriber for ${event}:`, error);
            }
        });
    }
    
    /**
     * Clear all subscribers for a specific event
     * @param {string} event - The event to clear
     */
    function clear(event) {
        if (eventRegistry[event]) {
            delete eventRegistry[event];
        }
    }
    
    /**
     * Clear all events and subscribers
     */
    function clearAll() {
        for (const event in eventRegistry) {
            if (eventRegistry.hasOwnProperty(event)) {
                delete eventRegistry[event];
            }
        }
    }
    
    // Public API
    return {
        subscribe: subscribe,
        publish: publish,
        clear: clear,
        clearAll: clearAll
    };
})();