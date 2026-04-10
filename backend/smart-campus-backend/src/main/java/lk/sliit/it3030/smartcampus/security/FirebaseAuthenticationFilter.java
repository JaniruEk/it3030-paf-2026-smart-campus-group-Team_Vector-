package lk.sliit.it3030.smartcampus.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = retrieveToken(request); // Extract the Firebase ID token from the request header

        if (token != null) { // Proceed if a token was found in the Authorization header
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token); // Verify the token with Firebase Admin SDK

                List<SimpleGrantedAuthority> authorities = new ArrayList<>(); // Initialize authorities list for Spring Security
                Map<String, Object> claims = decodedToken.getClaims(); // Extract custom claims from the decoded Firebase token

                if (claims != null && claims.get("role") != null) { // Check if a 'role' claim exists
                    String role = claims.get("role").toString().toUpperCase(); // Convert role to uppercase for consistency
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role)); // Add the role as a Spring Security authority
                } else {
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER")); // Assign default ROLE_USER if no role is present
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        decodedToken.getUid(), // Set Firebase UID as the user principal
                        decodedToken,         // Set the decoded token as credentials
                        authorities);         // Attach the granted authorities/roles

                SecurityContextHolder.getContext().setAuthentication(authentication); // Set the authentication in the security context

            } catch (FirebaseAuthException e) { // Catch errors during token verification (e.g., expired or invalid)
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // Set HTTP response status to 401
                response.getWriter().write("Invalid or expired Firebase Auth Token"); // Send error message to client
                return; // Terminate filter chain execution for this request
            }
        }

        filterChain.doFilter(request, response); // Continue to the next filter in the chain (or the controller)
    }

    private String retrieveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization"); // Fetch the 'Authorization' header from the HTTP request
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) { // Check for the 'Bearer ' prefix
            return bearerToken.substring(7); // Return the token part excluding the 'Bearer ' prefix
        }
        return null; // Return null if the header is missing or improperly formatted
    }
}

