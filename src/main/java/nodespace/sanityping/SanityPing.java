package nodespace.sanityping;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class SanityPing {
    @GetMapping("/")
    public String getMethodName() {
        return "Hello world";
    }
    
}
