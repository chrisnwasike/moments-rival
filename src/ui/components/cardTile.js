/**
 * Card Tile Component
 * Renders a moment card
 */

export class CardTile {
    /**
     * Render a card
     * @param {Object} card - Card data
     * @param {Object} options - Rendering options
     */
    static render(card, options = {}) {
        const {
            compact = false,
            selectable = false,
            showCost = true
        } = options;

        const typeClass = card.cardType.toLowerCase();
        const typeBadge = card.cardType;

        if (compact) {
            return `
                <div class="card-tile-compact ${typeClass}">
                    <div class="card-type-indicator bg-${this.getTypeBadgeColor(card.cardType)}">
                       <div>${typeBadge}</div>
                       ${showCost ? `<div class="card-cost-badge">${card.energyCost}</div>` : ''}
                    </div>
                    
                    <div class="card-name-compact">${card.playerName.split(' ').slice(0, 2).join(' ')}</div>
                    <div class="card-stats-compact">
                        ${card.cardType === 'OFFENSE' ? `⚔️${card.offense}` : ''}
                        ${card.cardType === 'DEFENSE' ? `🛡️${card.defense}` : ''}
                        ${card.cardType === 'SUPPORT' ? `⭐${card.boostValue}` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="card-tile ${typeClass} ${selectable ? 'selectable' : ''}">
                <div class="card-tile-header bg-${this.getTypeBadgeColor(card.cardType)}">
                    <span class="card-type-badge badge bg-${this.getTypeBadgeColor(card.cardType)} d-none">
                        ${card.cardType}
                    </span>

                    ${card.momentId ? `
                        <div class="card-nft-badge">
                             NFT #${card.serialNumber || '?'}
                        </div>
                    ` : ''}

                    ${showCost ? `<span class="card-cost p-1 text-black fw-bold bg-${this.getTypeBadgeColor(card.cardType)}">${card.energyCost}⚡</span>` : ''}
                </div>
                
                <div class="card-tile-body">
                    <img class="card-image" src="https://assets.nbatopshot.com/media/${card.mediaID}?width=256" alt="${card.playerName}">
                    <div class="card-player-name">${card.playerName}</div>
                    
                    <div class="card-stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Off</div>
                            <div class="stat-value">${card.offense}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Def</div>
                            <div class="stat-value">${card.defense}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Spd</div>
                            <div class="stat-value">${card.speed}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Agi</div>
                            <div class="stat-value">${card.agility}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a card
     * @param {Object} card - Card data
     * @param {Object} options - Rendering options
     */
    static renderModeTwo(card, options = {}) {
        const {
            compact = false,
            selectable = true,
            showCost = true
        } = options;

        const typeClass = card.cardType.toLowerCase();
        const typeBadge = card.cardType;


        let label, value;
        if (card.cardType === 'OFFENSE') {
            label = 'OFF';
            value = card.offense;
        }
        if (card.cardType === 'DEFENSE') {
            label = 'DEF';
            value = card.defense;
        }
        if (card.cardType === 'SUPPORT') {
            label = 'BOOST';  // ✅ Better label
            value = card.boostValue || card.agility;  // ✅ Use boostValue, fallback to agility
        }


        if (compact) {
            return `
                <div class="card-tile ${typeClass} ${selectable ? 'selectable' : ''}" data-card-id="${card.id}">
                    <div class="card-type-indicator bg-${this.getTypeBadgeColor(card.cardType)}">
                       <div>${typeBadge}</div>
                       ${showCost ? `<div class="card-cost-badge">${card.energyCost}</div>` : ''}
                    </div>
                    
                    <div class="card-name-compact">${card.playerName.split(' ').slice(0, 2).join(' ')}</div>
                    <div class="card-stats-compact">
                        ${card.cardType === 'OFFENSE' ? `⚔️${card.offense}` : ''}
                        ${card.cardType === 'DEFENSE' ? `🛡️${card.defense}` : ''}
                        ${card.cardType === 'SUPPORT' ? `⭐${card.agility}` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="card-tile ${typeClass} ${selectable ? 'selectable' : ''}" data-card-id="${card.id}">
                <div class="card-tile-body">
                    <img class="card-image" src="https://assets.nbatopshot.com/media/${card.mediaID}?width=256" alt="${card.playerName}">
                    
                    <div class="card-player-name" style="justify-content: space-around;margin-top: 70%; height: 60px; margin-bottom: 0; background: linear-gradient(0deg, ${this.getTypeColor(card.cardType)}, transparent);">
                        <div>${card.playerName}</div>
                    </div>

                    <div class="card-stats-grid" style="background:${this.getTypeColor(card.cardType)}">
                        <div class="stat-item">
                            <div class="stat-label">${label}</div>
                            <div class="stat-value">${value}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">MOM</div>
                            <div class="stat-value">${card.energyCost}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    /**
     * Render a card
     * @param {Object} card - Card data
     * @param {Object} options - Rendering options
     */
    static renderGameMode(card, options = {}) {
        const {
            selected = false,
            selectable = false,
            affordable = true,
            showCycleBtn = false,
            onSelect = true,
            disabled = false,
            large = false
        } = options;

        let label, value;
        if (card.cardType === 'OFFENSE') {
            label = 'OFF';
            value = card.offense;
        }
        if (card.cardType === 'DEFENSE') {
            label = 'DEF';
            value = card.defense;
        }
        if (card.cardType === 'SUPPORT') {
            label = 'BOOST';  // ✅ Better label
            value = card.boostValue || card.agility;  // ✅ Use boostValue, fallback to agility
        }


        const sizeClass = large ? 'card-tile-large' : 'card-tile';
        const selectedClass = selected ? 'selected' : '';
        const affordableClass = affordable ? '' : 'unaffordable';
        const disabledClass = disabled ? 'disabled' : '';
        const imgSRC = (card.mediaID) ? `https://assets.nbatopshot.com/media/${card.mediaID}?width=256` : 'assets/img/aiplayer.png'


        return `
    <div class="mx-auto ${card.cardType.toLowerCase()} ${sizeClass} ${selectedClass} ${affordableClass} ${disabledClass} ${selectable ? 'selectable' : ''}" 
         data-card-id="${card.id}" 
         ${onSelect && !disabled ? 'role="button"' : ''}>                
         <div class="card-tile-body">
                    <img class="card-image" src="${imgSRC}" alt="${card.playerName}">
                    
                    <div class="card-player-name" style="justify-content: space-around;margin-top: 80%; height: 60px; margin-bottom: 0; background: linear-gradient(0deg, ${this.getTypeColor(card.cardType)}, transparent);">
                        <div>${card.playerName}</div>
                    </div>

                    <div class="card-stats-grid" style="background:${this.getTypeColor(card.cardType)}">
                        <div class="stat-item">
                            <div class="stat-label">${label}</div>
                            <div class="stat-value">${value}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">MOM</div>
                            <div class="stat-value">${card.energyCost}</div>
                        </div>
                    </div>
                    ${showCycleBtn ? `
                        <button class="btn btn-sm btn-outline-info btn-cycler" 
                                data-cycle-btn
                                title="Cycle this card (1 energy)">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    ` : ''}
                </div>
            </div>

        `;
    }
    static getTypeBadgeColor(type) {
        const colors = {
            'OFFENSE': 'danger',
            'DEFENSE': 'primary',
            'SUPPORT': 'warning'
        };
        return colors[type] || 'secondary';
    }

    static getTypeColor(type) {
        const colors = {
            'OFFENSE': '#dc3545',
            'DEFENSE': '#0d6efd',
            'SUPPORT': '#ffc107'
        };
        return colors[type] || '#6c757d';
    }
}