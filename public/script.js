// ==========================================
// STEP 1: Get References to HTML Elements
// ==========================================

// These variables store references to elements in index.html
// We'll use them to update content and respond to user actions

const billsList = document.getElementById('bills-list');
const billsSection = document.getElementById('bills-section');
const detailSection = document.getElementById('detail-section');
const billDetail = document.getElementById('bill-detail');
const aiInterpretation = document.getElementById('ai-interpretation');
const refreshBtn = document.getElementById('refresh-btn');
const interpretBtn = document.getElementById('interpret-btn');
const backBtn = document.getElementById('back-btn');

// ==========================================
// STEP 2: Store Current State
// ==========================================

// Variable to store the currently selected bill
let currentBill = null;

// ==========================================
// STEP 3: Load Bills Function
// ==========================================

// This function fetches bills from the server and displays them
async function loadBills() {
    // Show loading message
    billsList.innerHTML = '<p class="loading">Loading bills...</p>';
    
    try {
        // Make request to our server's /api/bills endpoint
        const response = await fetch('/api/bills');
        
        // Convert response to JSON
        const data = await response.json();
        
        // Clear loading message
        billsList.innerHTML = '';
        
        // Check if we got any bills
        if (!data.bills || data.bills.length === 0) {
            billsList.innerHTML = '<p>No bills found.</p>';
            return;
        }
        
        // Loop through each bill and create a card
        data.bills.forEach(bill => {
            // Create a div element for the card
            const card = document.createElement('div');
            card.className = 'bill-card';
            
            // Set the card's HTML content
            card.innerHTML = `
                <div class="bill-number">${bill.number}</div>
                <div class="bill-title">${bill.title || 'No title available'}</div>
                <div class="bill-status">${bill.latestAction?.actionDate || 'Unknown date'}</div>
            `;
            
            // Add click handler - when card is clicked, show details
            card.onclick = () => showBillDetail(bill);
            
            // Add card to the bills list
            billsList.appendChild(card);
        });
        
    } catch (error) {
        // If something goes wrong, show error message
        billsList.innerHTML = '<p>Error loading bills. Please try again.</p>';
        console.error('Error loading bills:', error);
    }
}

// ==========================================
// STEP 4: Show Bill Detail Function
// ==========================================

// This function fetches detailed info about one bill and displays it
async function showBillDetail(bill) {
    // Store the bill for later use (AI interpretation)
    currentBill = bill;
    
    // Hide the bills list, show the detail view
    billsSection.style.display = 'none';
    detailSection.style.display = 'block';
    
    // Clear any previous AI interpretation
    aiInterpretation.innerHTML = '';
    
    // Extract bill information from the bill object
    const congress = bill.congress;
    const type = bill.type.toLowerCase();
    const number = bill.number.replace(/\D/g, ''); // Remove non-digits
    
    // Show loading message while fetching details
    billDetail.innerHTML = '<p class="loading">Loading bill details...</p>';
    
    try {
        // Fetch detailed bill information from server
        const response = await fetch(`/api/bill/${congress}/${type}/${number}`);
        const data = await response.json();
        const billData = data.bill;
        
        // Display bill details
        billDetail.innerHTML = `
            <h2>${billData.number}: ${billData.title || 'No title'}</h2>
            
            <p><strong>Introduced:</strong> ${billData.introducedDate || 'Unknown'}</p>
            
            <p><strong>Latest Action:</strong> ${billData.latestAction?.text || 'No recent action'} 
               (${billData.latestAction?.actionDate || 'Unknown date'})</p>
            
            <p><strong>Sponsors:</strong> ${billData.sponsors?.length || 0} sponsor(s)</p>
            
            <p><strong>Summary:</strong> ${billData.summary?.text || 'No summary available yet. This bill may be too recent to have a summary.'}</p>
        `;
        
    } catch (error) {
        // If fetching fails, show error
        billDetail.innerHTML = '<p>Error loading bill details. Please try again.</p>';
        console.error('Error loading bill details:', error);
    }
}

// ==========================================
// STEP 5: AI Interpretation Function
// ==========================================

// This function sends the bill to Gemini AI for explanation
async function interpretBill() {
    // Make sure we have a bill selected
    if (!currentBill) {
        aiInterpretation.innerHTML = '<p>No bill selected.</p>';
        return;
    }
    
    // Show loading message
    aiInterpretation.innerHTML = '<p class="loading">🤖 AI is analyzing the bill...</p>';
    
    // Disable button to prevent multiple clicks
    interpretBtn.disabled = true;
    
    try {
        // Send POST request to server with bill information
        const response = await fetch('/api/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                billTitle: currentBill.title || 'Untitled Bill',
                billText: currentBill.title || 'No text available'
                // Note: In a production app, you'd fetch the full bill text here
            })
        });
        
        // Get AI's response
        const data = await response.json();
        
        // Display the interpretation
        aiInterpretation.innerHTML = `
            <h3>🤖 AI Interpretation</h3>
            <p>${data.interpretation}</p>
        `;
        
    } catch (error) {
        // If AI request fails, show error
        aiInterpretation.innerHTML = '<p>Error getting AI interpretation. Please try again.</p>';
        console.error('Error getting AI interpretation:', error);
        
    } finally {
        // Re-enable button after request completes (success or failure)
        interpretBtn.disabled = false;
    }
}

// ==========================================
// STEP 6: Event Listeners
// ==========================================

// These connect user actions (clicks) to our functions

// When refresh button is clicked, reload bills
refreshBtn.addEventListener('click', loadBills);

// When interpret button is clicked, get AI explanation
interpretBtn.addEventListener('click', interpretBill);

// When back button is clicked, return to bills list
backBtn.addEventListener('click', () => {
    billsSection.style.display = 'block';
    detailSection.style.display = 'none';
});

// ==========================================
// STEP 7: Initialize App
// ==========================================

// Load bills when page first loads
loadBills();