package lk.sliit.it3030.smartcampus.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import java.security.Principal;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                try {
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                    String userId = decodedToken.getUid();
                    
                    UsernamePasswordAuthenticationToken auth = 
                        new UsernamePasswordAuthenticationToken(userId, null, null);
                    
                    accessor.setUser(auth);
                    
                    if (accessor.getSessionAttributes() != null) {
                        accessor.getSessionAttributes().put("USER_PRINCIPAL", auth);
                    }
                    
                    System.out.println("WebSocket Authentication Success: " + userId);
                } catch (Exception e) {
                    System.err.println("WebSocket Authentication Failed: " + e.getMessage());
                    throw new IllegalArgumentException("Invalid WebSocket Token");
                }
            } else {
                throw new IllegalArgumentException("No Authorization header found for WebSocket");
            }
        } else if (accessor != null && accessor.getUser() == null) {
            // Restore from session attributes if not a CONNECT frame and user is missing
            if (accessor.getSessionAttributes() != null && accessor.getSessionAttributes().containsKey("USER_PRINCIPAL")) {
                Principal auth = (Principal) accessor.getSessionAttributes().get("USER_PRINCIPAL");
                accessor.setUser(auth);
            }
        }

        return message;
    }
}

