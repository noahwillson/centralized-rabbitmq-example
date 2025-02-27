// src/message-handlers.js
function createMessageHandlers() {
  // Handler for test events
  async function handleTestEvent(message) {
    console.log("Handling test event:", message);
    // Process the test event
    // For example, you could update a database, call another service, etc.
    return { processed: true, timestamp: new Date() };
  }

  // Handler for command messages
  async function handleCommand(message) {
    console.log("Handling command:", message);
    // Process the command
    // For example, you could perform some business logic based on the command
    return { executed: true, timestamp: new Date() };
  }

  async function handleOrderProcessing(message) {
    console.log("Processing order:", message);

    // Simulate order processing
    const { orderId, items, customerId } = message.data;
    console.log(`Processing order ${orderId} for customer ${customerId}`);
    console.log(`Order contains ${items.length} items`);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`Order ${orderId} processed successfully`);
    return {
      processed: true,
      orderId,
      processingTime: 500,
      timestamp: new Date(),
    };
  }

  return {
    handleTestEvent,
    handleCommand,
    handleOrderProcessing,
  };
}

module.exports = createMessageHandlers;
