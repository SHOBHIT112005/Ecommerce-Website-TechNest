const productDescriptions = {
  "MacBook Pro": `A pro-grade laptop for creators and developers who need sustained performance, color-accurate visuals, and long battery life.

About this item:
- Liquid Retina XDR display with high contrast and up to 1600 nits peak HDR brightness.
- Apple silicon performance with dedicated media engines for ProRes, H.264, and HEVC workflows.
- Up to 24 hours of battery life (model dependent) with fast charging over MagSafe and USB-C.
- Pro I/O includes Thunderbolt, HDMI, SDXC, and a high-impedance headphone jack.
- Advanced audio and camera system for clear meetings, editing, and daily productivity.`,

  "ASUS ROG": `A premium gaming laptop tuned for high-FPS play, streaming, and creator workloads.

About this item:
- ROG Zephyrus-class performance with NVIDIA GeForce RTX graphics options.
- 16-inch class high-refresh display options up to 240Hz with strong color coverage.
- Intelligent cooling design to sustain performance under long gaming sessions.
- Fast LPDDR5X memory and PCIe storage for responsive loading and multitasking.
- Gamer-focused design with RGB lighting and robust port selection for peripherals.`,

  "MSI Gaming": `A performance-focused gaming machine built for competitive play and heavy multitasking.

About this item:
- Raider-class hardware with high-end Intel HX platform and RTX graphics configurations.
- Cooler Boost thermal design for stable performance under sustained GPU/CPU load.
- SteelSeries per-key RGB keyboard with anti-ghosting support for precise control.
- High refresh display options to reduce motion blur in fast-action titles.
- Rich I/O and tuning tools for streaming, external displays, and peripherals.`,

  "Dell XPS 15": `A premium 15-inch creator laptop that balances portability, performance, and display quality.

About this item:
- InfinityEdge 15.6-inch form factor with optional 3.5K OLED touch display.
- Color-focused panel options, including DCI-P3 coverage for editing workflows.
- Powerful H-series processor and discrete GPU configurations for creative apps.
- Precision-machined chassis with a professional, minimalist build.
- Thunderbolt USB-C connectivity for docks, fast storage, and external monitors.`,

  "Lenovo ThinkPad X1": `An ultralight business laptop designed for travel-heavy professionals and enterprise teams.

About this item:
- ThinkPad X1 Carbon class design with lightweight premium materials.
- 14-inch productivity display options including high-resolution OLED variants.
- Legendary ThinkPad keyboard and durable, business-ready construction.
- Enterprise-friendly security features and modern collaboration camera options.
- Strong battery life and efficient Intel platform for all-day office work.`,

  "HP Spectre x360": `A high-end 2-in-1 laptop that blends premium design with flexible tablet-style use.

About this item:
- Convertible x360 hinge for laptop, tent, stand, and tablet modes.
- 14-inch class OLED touch display options with up to 3K resolution and high color accuracy.
- Intel Core Ultra platform with AI-ready NPU support on recent configurations.
- Fast SSD storage and responsive memory for productivity and creative tasks.
- Premium build, pen support, and modern connectivity for work on the go.`,

  "Razer Blade 15": `A thin gaming laptop that delivers desktop-class visuals in a sleek portable chassis.

About this item:
- Blade 15 class models offer RTX 40-series GPU options for high-end gaming.
- 15.6-inch QHD 240Hz class display options for smooth motion and sharp detail.
- High-performance cooling and tuning for sustained gaming sessions.
- Premium CNC aluminum construction with a clean, understated look.
- Strong option for gaming, content creation, and hybrid work setups.`,

  "iPhone 15": `A flagship iPhone experience with strong camera upgrades and modern USB-C connectivity.

About this item:
- Super Retina XDR OLED display with bright outdoor visibility and Dynamic Island.
- Apple A16 Bionic chip for smooth everyday performance and efficient battery use.
- 48MP main camera system for detailed photos and improved low-light capture.
- USB-C charging and broad accessory compatibility across modern devices.
- Premium iOS experience with long-term software and security updates.`,

  "Samsung Galaxy S24": `A compact Android flagship focused on display quality, camera flexibility, and AI features.

About this item:
- 6.2-inch Dynamic AMOLED 2X display with adaptive 1-120Hz refresh rate.
- Triple-camera setup including 50MP wide, 12MP ultra-wide, and 3x telephoto lens.
- Flagship-grade performance for gaming, multitasking, and mobile productivity.
- Galaxy AI software features for translation, search, and writing assistance.
- Premium build and all-day battery profile for daily heavy use.`,

  "Xiaomi Redmi Note": `A value-focused smartphone series known for strong specs at a competitive price.

About this item:
- Redmi Note class design with large high-refresh AMOLED display options.
- High-resolution main camera options in current Note Pro variants.
- Big battery + fast charging combination for long daily runtime.
- Reliable midrange chipset performance for social, media, and gaming use.
- Practical feature set aimed at users who want flagship-like value.`,

  "Google Pixel 9": `A clean Android flagship with Google AI features and one of the best camera experiences.

About this item:
- 6.3-inch Actua OLED display with smooth 60-120Hz refresh rate.
- Google Tensor G4 and Titan M2 security coprocessor for AI and device protection.
- Advanced dual rear camera system with strong computational photography.
- Fast charging support and reliable all-day battery management.
- Pixel software experience with long update support and on-device intelligence.`,

  "OnePlus 12": `A performance-heavy flagship built around speed, display quality, and rapid charging.

About this item:
- Snapdragon 8 Gen 3 platform with LPDDR5X RAM and UFS 4.0 storage.
- 6.82-inch 120Hz ProXDR display with high brightness and premium color depth.
- 5400mAh battery with fast wired SUPERVOOC and wireless AIRVOOC charging.
- Hasselblad-tuned camera system with wide, ultra-wide, and periscope telephoto lenses.
- OxygenOS experience optimized for fluid multitasking and gaming.`,

  "Nothing Phone (2)": `A distinctive Android phone that combines clean software with signature Glyph lighting.

About this item:
- Transparent industrial design with customizable Glyph Interface notifications.
- Snapdragon 8+ Gen 1 platform for stable flagship-level everyday performance.
- Smooth OLED display with high refresh rate for fluid UI and gaming.
- Dual 50MP camera system tuned for balanced photo and video output.
- Minimal, bloat-light Nothing OS experience focused on speed and simplicity.`,

  "Oppo Find X7": `A camera-focused flagship designed for users who prioritize photography and display quality.

About this item:
- 6.78-inch class OLED display with adaptive 1-120Hz refresh behavior.
- High-end camera stack including wide, ultra-wide, and periscope telephoto modules.
- Peak brightness and color performance tuned for HDR media consumption.
- Flagship memory and storage tiers with LPDDR5X and UFS 4.0 class performance.
- Premium build and imaging pipeline designed for versatile mobile shooting.`,

  "AirPods Pro": `Premium Apple earbuds tuned for immersive listening, calls, and day-to-day convenience.

About this item:
- Active Noise Cancellation and Transparency modes for flexible listening control.
- Adaptive Audio and personalized sound features on modern Apple software builds.
- In-ear design with multiple tip sizes for fit and passive isolation.
- Seamless pairing, device switching, and Find My integration in the Apple ecosystem.
- Compact charging case with wireless charging support for easy top-ups.`,

  "Huawei FreeBuds": `Feature-rich true wireless earbuds focused on audio quality, call clarity, and comfort.

About this item:
- FreeBuds Pro class tuning with high-resolution codec support on compatible devices.
- Intelligent noise cancellation system for commuting and office environments.
- Multi-device connectivity with low-latency wireless performance.
- Clear voice pickup with AI-assisted call noise handling.
- Lightweight in-ear fit with portable charging case for daily carry.`,

  "Gaming Headset": `An immersive gaming headset designed for directional audio and clear team communication.

About this item:
- Virtual 7.1 surround sound support for positional awareness in competitive games.
- Noise-cancelling microphone for cleaner voice chat and streaming sessions.
- Comfortable over-ear design with soft ear cushions for long play sessions.
- Wired low-latency connection for consistent in-game audio timing.
- Multi-platform compatibility across PC and major consoles.`,

  "Apple Watch Series 9": `A health-first smartwatch that combines fitness tracking, notifications, and Apple ecosystem integration.

About this item:
- S9-generation Apple Watch platform with responsive everyday performance.
- Always-on Retina display for quick glanceable stats and notifications.
- Advanced wellness stack including heart-rate, ECG, and activity insights.
- Tight integration with iPhone apps, calls, messages, and Apple Pay.
- Lightweight design with strong app ecosystem for fitness and productivity.`,

  "Samsung Galaxy Watch": `A Wear OS smartwatch line focused on health tracking, fitness, and Android integration.

About this item:
- Super AMOLED display options with always-on visibility.
- BioActive sensor ecosystem for heart-rate and wellness measurements.
- Wear OS experience with Google apps and Samsung ecosystem features.
- Fast performance platform with support for workouts, maps, and notifications.
- Modern design with multiple sizes and strap options for daily wear.`,

  "Logitech MX Master 3S": `A top-tier productivity mouse built for precision, comfort, and advanced workflow control.

About this item:
- 8K DPI tracking with Darkfield sensor for accurate control on many surfaces.
- Quiet Click switches reduce noise while preserving tactile feedback.
- MagSpeed electromagnetic scrolling for precise or ultra-fast navigation.
- Multi-device Easy-Switch support with Bluetooth and Logi Bolt compatibility.
- Ergonomic shape optimized for long office and creative sessions.`,

  "Anker Power Bank": `A high-capacity portable charger designed for travel, work, and multi-device charging.

About this item:
- 20,000mAh class capacity for multiple phone charges on one trip.
- Fast USB-C power delivery support for phones, tablets, and some laptops.
- Multi-port output for charging more than one device at a time.
- Built-in safety protections for temperature, voltage, and current management.
- Reliable travel companion for flights, commutes, and long workdays.`,

  "Nintendo Switch OLED": `A flexible gaming console that works as handheld, tabletop, and TV-connected system.

About this item:
- Vibrant 7-inch OLED screen for richer colors and stronger contrast in handheld mode.
- Hybrid design lets you switch between home console and portable play instantly.
- 64GB internal storage plus microSD expansion for larger game libraries.
- Enhanced dock with wired LAN support for steadier online play.
- Huge first-party and indie catalog across single-player and local multiplayer titles.`,

  "PS5 DualSense": `Sony's next-generation controller built to make gameplay feel more tactile and responsive.

About this item:
- Haptic feedback system delivers nuanced vibration effects across different game actions.
- Adaptive triggers add dynamic resistance for shooting, driving, and sports interactions.
- Built-in microphone and headset jack support voice chat without extra hardware.
- Ergonomic layout with responsive buttons and sticks for long gaming sessions.
- Compatible with PS5 and supported PC/mobile experiences.`,

  "Xbox Series X": `A high-performance console focused on 4K gaming, fast loading, and smooth frame rates.

About this item:
- 12 TFLOPS GPU and custom SSD architecture for fast load times and quick resume.
- Targets true 4K gameplay with support for up to 120 FPS in supported titles.
- Hardware-accelerated ray tracing and modern HDR capabilities for visual depth.
- Backward compatibility across multiple Xbox generations and accessories.
- Strong ecosystem integration with Game Pass, cloud services, and multiplayer features.`,

  "Samsung Odyssey G7": `A performance gaming monitor line built for speed, sharp detail, and competitive play.

About this item:
- 4K-class and high-refresh configurations available in modern Odyssey G7 variants.
- Up to 144Hz refresh rate and 1ms response class for reduced blur and latency.
- HDR support with wide color output for richer games and media.
- Adaptive sync support for smoother frame delivery with compatible GPUs.
- Gamer-first design with robust stand adjustments and immersive panel tuning.`
};

export default productDescriptions;
