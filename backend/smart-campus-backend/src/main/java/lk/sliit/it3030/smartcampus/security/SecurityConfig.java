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
import org.springframework.security.config.Customizer;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private FirebaseAuthenticationFilter firebaseAuthenticationFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "X-Requested-With", "Accept", "Origin"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/v1/auth/public/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/v1/tickets", "/api/v1/tickets/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/v1/booking/*/status").hasRole("ADMIN")
                .requestMatchers("/api/v1/booking/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/resources/**").authenticated()
                .requestMatchers("/api/v1/resources/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(firebaseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}