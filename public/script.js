// ==========================================
// STEP 1: Get References to HTML Elements
// ==========================================

const billsList = document.getElementById('bills-list');
const billsSection = document.getElementById('bills-section');
const detailSection = document.getElementById('detail-section');
const billDetail = document.getElementById('bill-detail');
const aiInterpretation = document.getElementById('ai-interpretation');
const refreshBtn = document.getElementById('refresh-btn');
const interpretBtn = document.getElementById('interpret-btn');
const backBtn = document.getElementById('back-btn');

const searchInput = document.getElementById('search-input');
const resultsList = document.getElementById('results-list');

const chatSection = document.getElementById('chat-section');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// ==========================================
// STEP 2: Store Current State
// ==========================================

let currentBill = null;
let allBills = [];
let conversationHistory = [];

// ==========================================
// STEP 3: Load Bills Function
// ==========================================

async function loadBills() {
    billsList.innerHTML = '<p class="loading">Loading bills...</p>';
    
    try {
        const response = await fetch('/api/bills');
        const data = await response.json();
        
        billsList.innerHTML = '';
        
        if (!data.bills || data.bills.length === 0) {
            billsList.innerHTML = '<p>No bills found.</p>';
            return;
        }
        
        allBills = data.bills;
        
        data.bills.forEach(bill => {
            const card = document.createElement('div');
            card.className = 'bill-card';
            
            card.innerHTML = `
                <div class="bill-number">${bill.number}</div>
                <div class="bill-title">${bill.title || 'No title available'}</div>
                <div class="bill-status">${bill.latestAction?.actionDate || 'Unknown date'}</div>
            `;
            
            card.onclick = () => showBillDetail(bill);
            billsList.appendChild(card);
        });
        
    } catch (error) {
        billsList.innerHTML = '<p>Error loading bills. Please try again.</p>';
        console.error('Error loading bills:', error);
    }
}

// ==========================================
// STEP 4: Show Bill Detail Function
// ==========================================

async function showBillDetail(bill) {
    billsSection.style.display = 'none';
    detailSection.style.display = 'block';
    
    aiInterpretation.innerHTML = '';
    
    const congress = bill.congress;
    const type = bill.type.toLowerCase();
    const number = bill.number.replace(/\D/g, '');
    
    billDetail.innerHTML = '<p class="loading">Loading bill details...</p>';
    
    try {
        const response = await fetch(`/api/bill/${congress}/${type}/${number}`);
        const data = await response.json();
        const billData = data.bill;
        
        // IMPORTANT: Store the full bill data in currentBill so we can use it in interpretBill()
        currentBill = { ...bill, ...billData };
        
        // Display bill details with simplified text links
        billDetail.innerHTML = `
            <h2>${billData.number}: ${billData.title || 'No title'}</h2>
            
            <p><strong>Introduced:</strong> ${billData.introducedDate || 'Unknown'}</p>
            
            <p><strong>Latest Action:</strong> ${billData.latestAction?.text || 'No recent action'} 
               (${billData.latestAction?.actionDate || 'Unknown date'})</p>
            
            <p><strong>Sponsors:</strong> ${billData.sponsors?.length || 0} sponsor(s)</p>
            
            <p><strong>Summary:</strong> ${billData.summary?.text || 'No summary available yet. This bill may be too recent to have a summary.'}</p>
            
            <!-- Full Bill Text Links -->
            ${billData.text ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p><strong>📄 Full Bill Text</strong></p>
                <p style="font-size: 0.9em; color: #666; margin: 10px 0;">
                    View the complete bill text in your preferred format:
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${billData.text.formats.map(format => 
                      `<a href="${format.url}" target="_blank" style="
                          display: inline-block;
                          padding: 10px 16px;
                          background: #667eea;
                          color: white;
                          text-decoration: none;
                          border-radius: 6px;
                          font-weight: 500;
                          transition: background 0.3s;
                      " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                        ${format.type}
                      </a>`
                    ).join('')}
                </div>
                <p style="font-size: 0.85em; color: #999; margin-top: 10px;">
                    Opens on Congress.gov
                </p>
            </div>
            ` : ''}
        `;
        
        conversationHistory = [];
        chatMessages.innerHTML = '';
        chatSection.style.display = 'block';
        
    } catch (error) {
        billDetail.innerHTML = '<p>Error loading bill details. Please try again.</p>';
        console.error('Error loading bill details:', error);
    }
}

// ==========================================
// STEP 5: AI Interpretation Function
// ==========================================

async function interpretBill() {
    if (!currentBill) {
        aiInterpretation.innerHTML = '<p>No bill selected.</p>';
        return;
    }
    
    aiInterpretation.innerHTML = '<p class="loading">🤖 AI is analyzing the bill...</p>';
    interpretBtn.disabled = true;
    
    try {
        // Use summary if available, otherwise use title
        const billContent = currentBill.summary?.text || currentBill.title || 'No text available';
        
        const response = await fetch('/api/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                billTitle: currentBill.title || 'Untitled Bill',
                billText: billContent  // Now sends the actual summary!
            })
        });
        
        const data = await response.json();
        
        aiInterpretation.innerHTML = `
            <h3>🤖 AI Interpretation</h3>
            <p>${data.interpretation}</p>
        `;
        
    } catch (error) {
        aiInterpretation.innerHTML = '<p>Error getting AI interpretation. Please try again.</p>';
        console.error('Error getting AI interpretation:', error);
        
    } finally {
        interpretBtn.disabled = false;
    }
}

// ==========================================
// STEP 5.5: Search Bills Function
// ==========================================

function searchBills(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term.length === 0) {
        resultsList.innerHTML = '';
        resultsList.style.display = 'none';
        return;
    }
    
    const matchingBills = allBills.filter(bill => {
        const billNumber = bill.number.toLowerCase();
        const billTitle = (bill.title || '').toLowerCase();
        const billSummary = (bill.summary?.text || '').toLowerCase();
        
        return billNumber.includes(term) || 
               billTitle.includes(term) || 
               billSummary.includes(term);
    });
    
    displaySearchResults(matchingBills, term);
}

// ==========================================
// STEP 5.6: Display Search Results Function
// ==========================================

function displaySearchResults(matches, searchTerm) {
    resultsList.innerHTML = '';
    
    if (matches.length === 0) {
        resultsList.innerHTML = '<li class="no-results">No bills found matching your search</li>';
        resultsList.style.display = 'block';
        return;
    }
    
    matches.forEach(bill => {
        const li = document.createElement('li');
        li.className = 'result-item';
        
        li.innerHTML = `
            <div class="result-number">${bill.number}</div>
            <div class="result-title">${bill.title || 'No title available'}</div>
        `;
        
        li.onclick = () => {
            searchInput.value = '';
            resultsList.innerHTML = '';
            resultsList.style.display = 'none';
            showBillDetail(bill);
        };
        
        resultsList.appendChild(li);
    });
    
    resultsList.style.display = 'block';
}

// ==========================================
// STEP 5.7: Send Chat Message Function
// ==========================================

async function sendChatMessage() {
    const userMessage = chatInput.value.trim();
    
    if (!userMessage) return;
    
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    displayChatMessage(userMessage, 'user');
    chatInput.value = '';
    
    try {
        displayChatMessage('🤖 AI is thinking...', 'loading');
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                billTitle: currentBill.title || 'Untitled Bill',
                billText: currentBill.summary?.text || currentBill.title || 'No text available',
                userQuestion: userMessage,
                conversationHistory: conversationHistory
            })
        });
        
        const data = await response.json();
        
        const messages = chatMessages.querySelectorAll('.chat-message');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.classList.contains('loading')) {
                lastMessage.remove();
            }
        }
        
        displayChatMessage(data.response, 'ai');
        
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        conversationHistory.push({
            role: 'assistant',
            content: data.response
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        displayChatMessage('Error: Could not get response. Please try again.', 'error');
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// ==========================================
// STEP 5.8: Display Chat Message Function
// ==========================================

function displayChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message;
    
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// STEP 6: Event Listeners
// ==========================================

// Bills and navigation
refreshBtn.addEventListener('click', loadBills);
interpretBtn.addEventListener('click', interpretBill);
backBtn.addEventListener('click', () => {
    billsSection.style.display = 'block';
    detailSection.style.display = 'none';
});

// Search functionality
searchInput.addEventListener('input', (event) => {
    searchBills(event.target.value);
});

document.addEventListener('click', (event) => {
    if (event.target !== searchInput && event.target !== resultsList) {
        resultsList.style.display = 'none';
    }
});

// Chat functionality
sendBtn.addEventListener('click', sendChatMessage);

chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
});

// ==========================================
// STEP 7: Initialize App
// ==========================================

loadBills();