// package lk.sliit.it3030.smartcampus.security;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// @Configuration
// @EnableWebSecurity
// @EnableMethodSecurity
// public class SecurityConfig {

//     @Autowired
//     private FirebaseAuthenticationFilter firebaseAuthenticationFilter;

//     @Bean
//     public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//         http
//             .cors(cors -> cors.configure(http))
//             .csrf(csrf -> csrf.disable())
//             .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//             .authorizeHttpRequests(authz -> authz
//                 .requestMatchers("/api/v1/auth/public/**").permitAll()
//                 .requestMatchers("/booking/**").permitAll()
//                 .anyRequest().authenticated()
//             )
//             .addFilterBefore(firebaseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            
//         return http.build();
//     }
// }



package lk.sliit.it3030.smartcampus.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Main security configuration class for the application.
 * This class defines CORS policies, CSRF settings, session management (stateless), 
 * and specific authorization rules for HTTP endpoints using Spring Security.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private FirebaseAuthenticationFilter firebaseAuthenticationFilter; // Custom filter for Firebase token validation

    /**
     * Configures Cross-Origin Resource Sharing (CORS) to allow the frontend to communicate with the backend.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173")); // Allow frontend dev server origins
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")); // Supported HTTP methods
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "X-Requested-With", "Accept", "Origin")); // Allowed request headers
        configuration.setAllowCredentials(true); // Permit cookies and authentication headers in cross-origin requests
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply this configuration to all endpoints
        return source;
    }

    /**
     * Defines the security filter chain, including endpoint protection, session policy, and filter ordering.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable and configure CORS
            .csrf(csrf -> csrf.disable()) // Disable CSRF as authentication is token-based (stateless)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Disable sessions; use JWT tokens instead
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow all pre-flight OPTIONS requests
                .requestMatchers("/api/v1/auth/public/**").permitAll() // Publicly accessible authentication endpoints
                .requestMatchers("/ws/**").permitAll() // Permit WebSocket connections
                .requestMatchers("/error").permitAll() // Allow access to the default error page
                .requestMatchers("/api/v1/tickets", "/api/v1/tickets/**").authenticated() // Require login for ticket management
                .requestMatchers(HttpMethod.PATCH, "/api/v1/booking/*/status").hasRole("ADMIN") // Only ADMINs can change booking status
                .requestMatchers("/api/v1/booking/**").authenticated() // Require login for general booking access
                .requestMatchers(HttpMethod.GET, "/api/v1/resources/**").authenticated() // All users can view resources
                .requestMatchers("/api/v1/resources/**").hasRole("ADMIN") // Only ADMINs can create/edit/delete resources
                .anyRequest().authenticated() // All other requests must be authenticated
            )
            .addFilterBefore(firebaseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Inject Firebase filter before the standard auth filter

        return http.build(); // Build and return the security configuration
    }
}