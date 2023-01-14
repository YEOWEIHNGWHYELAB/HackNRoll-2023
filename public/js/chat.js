let chatInput,
    chatMessages,
    chatMessagesContainer;

function appendChatMsg(username, msg) {
    // Time & Date
    let today = new Date();
    let hr = today.getHours(),
        min = today.getMinutes();

    if (hr < 10) hr = "0" + hr;
    if (min < 10) min = "0" + min;
    let time = `${hr}:${min}`;

    // logs won't have a msg
    let headerClass = (msg !== undefined && msg != "") ? "chat-username" : "chat-log";

    // Create chat message element
    let item = document.createElement("div");
    item.className = "chat-msg-box";
    item.innerHTML += `<span class="chat-msg-time">${time}</span>`;
    item.innerHTML += `<span class="${headerClass}">${username}</span>`;

    // include message if any
    if (msg !== undefined && msg != "")
        item.innerHTML += `<span class="chat-msg">${msg}</span>`;

    chatMessages.appendChild(item);

    // scroll to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function chatSend() {
    if (chatInput.value) {
        socket.emit("chat_message", chatInput.value);
        chatInput.value = "";
    }
}

function initChatDOM() {
    chatInput = document.querySelector("#chatInput");
    chatMessages = document.querySelector("#chatMessages");
    chatMessagesContainer = document.querySelector("#chatMessagesContainer");

    chatInput.onkeypress = (e) => {
        if (e.keyCode == 13) {
            chatSend();
        }
    };
}