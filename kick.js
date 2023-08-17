// kick.js

let baseUrl = "https://kick.com/api/v2/channels/";

async function fetchData(channelSlug) {
  const apiUrl = `${baseUrl}${channelSlug}`;
  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error(
        `Failed to fetch channel information for slug ${channelSlug}`
      );
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
/**
 * Fetches channel data by slug and returns selected properties.
 * @param {string} channelSlug - The channel's slug/username.
 * @param {Array<string>} selectedProperties - The properties to select from the channel data.
 * @returns {Promise<Partial<object>|null>} - The selected properties of the channel data.
 */
export async function getChannelData(channelSlug, properties) {
  const data = await fetchData(channelSlug);
  if (!data) {
    return null;
  }

  const result = {};
  properties.forEach((property) => {
    result[property] = data[property] !== undefined ? data[property] : null;
  });

  return result;
}

// Example usage:
// const channelSlug = "adinross";
// const properties = ["id", "user_id", "is_banned"];
// const channelData = await getChannelData(channelSlug, properties);
// console.log(channelData);

export function subscribeToChatroom(chatroomId, onMessageReceived) {
  const socket = new WebSocket(
    "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false"
  );

  socket.addEventListener("open", () => {
    const subscriptionData = {
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: `chatrooms.${chatroomId}.v2`,
      },
    };
    socket.send(JSON.stringify(subscriptionData));
  });

  socket.addEventListener("message", (event) => {
    const eventData = JSON.parse(event.data);
    if (eventData.event === "App\\Events\\ChatMessageEvent") {
      const chatMessage = JSON.parse(eventData.data);
      onMessageReceived(chatMessage);
    }
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket connection closed");
  });

  return () => {
    socket.close();
  };
}

export function subscribeAndHandleMessages(chatroomId, onMessageReceived) {
  const closeWebSocket = subscribeToChatroom(chatroomId, (chatMessage) => {
    const sender = chatMessage.sender.username;
    const message = chatMessage.content;
    onMessageReceived(sender, message);
  });

  return closeWebSocket;
}
