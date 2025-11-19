/**
 * Meter Components
 * Progress bars and gauges
 */

export class EnergyMeter {
    /**
     * Render energy meter
     * @param {number} current - Current energy
     * @param {number} max - Maximum energy
     * @param {string} color - Bootstrap color variant
     */
    static render(current, max, color = 'primary', label = null) {
        const percentage = Math.min(100, (current / max) * 100);
        
        return `
            <div class="energy-meter">
                <div class="d-flex justify-content-between mb-1">
                    <span class="energy-owner">${label}</span>
                    <div class="energy-info>
                        <span class="energy-value">${current}</span>
                        <span class="energy-max text-muted">/ ${max}</span>
                    </div>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-${color}" 
                         role="progressbar" 
                         style="width: ${percentage}%"
                         aria-valuenow="${current}" 
                         aria-valuemin="0" 
                         aria-valuemax="${max}">
                    </div>
                </div>
            </div>
        `;
    }
}

export class HealthMeter {
    /**
     * Render health meter
     * @param {number} current - Current health
     * @param {number} max - Maximum health
     */
    static render(current, max) {
        const percentage = Math.min(100, (current / max) * 100);
        let color = 'success';
        
        if (percentage < 30) color = 'danger';
        else if (percentage < 60) color = 'warning';
        
        return `
            <div class="health-meter">
                <div class="d-flex justify-content-between mb-1">
                    <span><i class="bi bi-heart-fill text-danger"></i> Health</span>
                    <span>${current} / ${max}</span>
                </div>
                <div class="progress" style="height: 15px;">
                    <div class="progress-bar bg-${color}" 
                         role="progressbar" 
                         style="width: ${percentage}%">
                    </div>
                </div>
            </div>
        `;
    }
}