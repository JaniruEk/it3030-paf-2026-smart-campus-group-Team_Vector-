package lk.sliit.it3030.smartcampus.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import java.security.Principal;
import java.util.Map;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String token = accessor.getFirstNativeHeader("Authorization");
                
                if (token != null && token.startsWith("Bearer ")) {
                    token = token.substring(7);
                    try {
                        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                        String userId = decodedToken.getUid();
                        
                        UsernamePasswordAuthenticationToken auth = 
                            new UsernamePasswordAuthenticationToken(userId, null, null);
                        
                        StompHeaderAccessor mutableAccessor = StompHeaderAccessor.wrap(message);
                        mutableAccessor.setUser(auth);
                        Map<String, Object> sessionAttributes = mutableAccessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            sessionAttributes.put("USER_PRINCIPAL", auth);
                        }
                        
                        return MessageBuilder.createMessage(message.getPayload(), mutableAccessor.getMessageHeaders());
                    } catch (Exception e) {
                        throw new IllegalArgumentException("Invalid WebSocket Token");
                    }
                } else {
                    throw new IllegalArgumentException("No Authorization header found for WebSocket");
                }
            } else {
                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null && sessionAttributes.containsKey("USER_PRINCIPAL")) {
                    Principal auth = (Principal) sessionAttributes.get("USER_PRINCIPAL");
                    StompHeaderAccessor mutableAccessor = StompHeaderAccessor.wrap(message);
                    mutableAccessor.setUser(auth);
                    return MessageBuilder.createMessage(message.getPayload(), mutableAccessor.getMessageHeaders());
                }
            }
        }
        return message;
    }
}
