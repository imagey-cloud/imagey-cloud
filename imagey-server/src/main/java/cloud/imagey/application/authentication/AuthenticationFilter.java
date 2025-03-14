/*
 * This file is part of Imagey.
 *
 * Imagey is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Imagey is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Imagey.  If not, see <http://www.gnu.org/licenses/>.
 */
package cloud.imagey.application.authentication;

import static cloud.imagey.domain.token.TokenService.ONE_HOUR;
import static javax.servlet.http.HttpServletResponse.SC_FORBIDDEN;
import static javax.servlet.http.HttpServletResponse.SC_NOT_FOUND;

import java.io.IOException;
import java.util.Optional;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import cloud.imagey.domain.mail.Email;
import cloud.imagey.domain.token.DecodedToken;
import cloud.imagey.domain.token.Token;
import cloud.imagey.domain.token.TokenService;
import cloud.imagey.domain.user.User;
import cloud.imagey.domain.user.UserRepository;

@ApplicationScoped
@WebFilter(urlPatterns = "/authentications/*")
public class AuthenticationFilter extends HttpFilter {

    private static final Logger LOG = LogManager.getLogger(AuthenticationFilter.class);
    @Inject
    private TokenService tokenService;
    @Inject
    private UserRepository userRepository;

    @Override
    public void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        LOG.info("Authentication started");
        Token authenticationToken = extractToken(request.getRequestURI());
        Optional<DecodedToken> decoded = tokenService.decode(authenticationToken);
        if (decoded.isEmpty()) {
            LOG.info("Decoding not successful");
            response.sendError(SC_FORBIDDEN);
            return;
        }
        Email email = new Email(decoded.get().jwt().getSubject());
        User user = new User(email);
        if (!userRepository.exists(user)) {
            LOG.info("User not found");
            response.sendError(SC_NOT_FOUND);
            return;
        }
        Token token = tokenService.generateToken(user, ONE_HOUR);
        response.setHeader("Set-Cookie", "token=" + token.token() + "; HttpOnly; SameSite=strict; Path=/");
        response.sendRedirect("/?email=" + email.address());
    }

    private Token extractToken(String requestUri) {
        String authenticationPart = "/authentications/";
        return new Token(requestUri.substring(requestUri.indexOf(authenticationPart) + authenticationPart.length()));
    }
}
