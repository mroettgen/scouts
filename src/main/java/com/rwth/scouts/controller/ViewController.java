package com.rwth.scouts.controller;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// This class is used to map our HTML to URLs, nothing special happening
@Controller
public class ViewController {
	@GetMapping("/")
	public String getIndex() {
		return "redirect:/home";	// default site is "/home"
	}
	
	@GetMapping("/home") 
	public String getStoryPage(HttpSession session) {
		return "story";
	}
	
	@GetMapping("/admin") 
	public String getAdminPage() {
		return "admin";
	}
	
	@GetMapping("/stats")
	public String getStatsPage() {
		return "stats";
	}

	@GetMapping("/how-to")
	public String getHowToPage() {
		return "how-to";
	}
}
