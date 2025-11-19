/*
 * Get Top Shot Moments
 * Reads all NBA Top Shot Moments owned by an address
 * 
 * Network Configuration:
 * - Testnet: Contract at 0x877931736ee77cff
 * - Mainnet: Contract at 0x0b2a3299cc857e29
 * 
 * Returns: Array of MomentData structs with relevant fields
 */

import TopShot from 0x0b2a3299cc857e29  // Testnet address
// For mainnet, use: import TopShot from 0x0b2a3299cc857e29

access(all) fun main(account: Address): [MomentData] {
    // Get account reference
    let acct = getAccount(account)
    
    // Borrow public collection capability
    let collectionRef = acct.capabilities.borrow<&{TopShot.MomentCollectionPublic}>(/public/MomentCollection)
        ?? panic("Could not borrow capability from public collection at /public/MomentCollection")
    
    // Get all moment IDs
    let ids = collectionRef.getIDs()
    
    var moments: [MomentData] = []
    
    // Loop through each moment and fetch metadata
    for id in ids {
        let nft = collectionRef.borrowMoment(id: id)
            ?? panic("Could not borrow moment with ID: ".concat(id.toString()))
        
        // Get play metadata
        let playMetadata = TopShot.getPlayMetaData(playID: nft.data.playID) ?? {}
        
        // Get set name
        let setName = TopShot.getSetName(setID: nft.data.setID) ?? "Unknown Set"
        
        // Extract relevant fields
        let playerName = playMetadata["FullName"] ?? "Unknown Player"
        let playType = playMetadata["PlayType"] ?? "Unknown"
        let playCategory = playMetadata["PlayCategory"] ?? "Unknown"
        let teamAtMoment = playMetadata["TeamAtMoment"] ?? "Unknown"
        let dateOfMoment = playMetadata["DateOfMoment"] ?? "Unknown"
        
        // Determine tier/rarity from set name
        let tier = determineTier(setName: setName)
        
        // Create moment data struct
        moments.append(MomentData(
            momentId: id,
            playID: nft.data.playID,
            playerName: playerName,
            team: teamAtMoment,
            setName: setName,
            tier: tier,
            playCategory: playCategory,
            serialNumber: nft.data.serialNumber,
            date: dateOfMoment,
            playType: playType
        ))
    }
    
    return moments
}

// Helper function to determine tier from set name
access(all) fun determineTier(setName: String): String {
    let lowerSet = setName.toLower()
    
    if lowerSet.contains("legendary") || lowerSet.contains("ultimate") {
        return "Legendary"
    } else if lowerSet.contains("rare") || lowerSet.contains("playoff") {
        return "Rare"
    } else if lowerSet.contains("fandom") {
        return "Fandom"
    } else {
        return "Common"
    }
}

// Struct to hold moment data
access(all) struct MomentData {
    access(all) let momentId: UInt64
    access(all) let playID: UInt32
    access(all) let playerName: String
    access(all) let team: String
    access(all) let setName: String
    access(all) let tier: String
    access(all) let playCategory: String
    access(all) let serialNumber: UInt32
    access(all) let date: String
    access(all) let playType: String
    
    init(
        momentId: UInt64,
        playID: UInt32,
        playerName: String,
        team: String,
        setName: String,
        tier: String,
        playCategory: String,
        serialNumber: UInt32,
        date: String,
        playType: String
    ) {
        self.momentId = momentId
        self.playID = playID
        self.playerName = playerName
        self.team = team
        self.setName = setName
        self.tier = tier
        self.playCategory = playCategory
        self.serialNumber = serialNumber
        self.date = date
        self.playType = playType
    }
}