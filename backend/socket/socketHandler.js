export default (io) => {
  io.on('connection', (socket) => {
    console.log(`New Client Connected: ${socket.id}`);
    
    // 1. JOIN SCHOOL ROOM
    // When the frontend connects, it will emit 'join_school' with the schoolId.
    socket.on('join_school', (schoolId) => {
      if (schoolId) {
        socket.join(schoolId);
        console.log(`User ${socket.id} joined room: ${schoolId}`);
      }
    });
    
    // 2. HANDLE EMERGENCY ALERT (Triggered by Principal)
    socket.on('trigger_alert', (data) => {
      const { schoolId, type, message, timestamp } = data;
      
      console.log(`ALERT TRIGGERED in School ${schoolId}: ${type}`);
      
      // Broadcast to everyone in that specific school room
      io.to(schoolId).emit('receive_alert', {
        type,      // e.g., 'FIRE', 'EARTHQUAKE'
        message,   // e.g., 'Fire reported in Lab 1'
        timestamp
      });
    });
    
    // 3. HANDLE SAFETY CHECK-INS (Triggered by Teachers later)
    socket.on('mark_safe', (data) => {
      // We will send this update to the Principal's dashboard
      const { schoolId, studentId, status } = data;
      io.to(schoolId).emit('update_dashboard', { studentId, status });
    });
    
    socket.on('disconnect', () => {
      console.log('Client Disconnected', socket.id);
    });
  });
};