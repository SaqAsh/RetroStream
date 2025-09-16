{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust toolchain
    rustc
    cargo
    rust-analyzer

    # Build tools
    pkg-config
    cmake
    clang

    # System libraries for xcap
    xorg.libX11
    xorg.libXrandr
    xorg.libXScrnSaver
    xorg.libxcb
    libGL

    # GTK dependencies
    glib
    gtk3
    cairo
    gdk-pixbuf
    atk
    pango

    # SSL/TLS
    openssl
    
    # Screen capture dependencies
    pipewire
    mesa
    libgbm

    # Additional development tools
    cargo-watch
    cargo-flamegraph
    cargo-cache
    
    # Frontend tools
    bun
  ];

  # Environment variables
  RUST_BACKTRACE = "1";
  RUST_LOG = "debug";

  # Optimize for build speed
  CARGO_NET_GIT_FETCH_WITH_CLI = "true";
  CARGO_REGISTRIES_CRATES_IO_PROTOCOL = "sparse";
  
  # Clang for bindgen
  LIBCLANG_PATH = "${pkgs.clang.cc.lib}/lib";

  # Library paths
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
    pkgs.xorg.libX11
    pkgs.xorg.libXrandr
    pkgs.xorg.libXScrnSaver
    pkgs.xorg.libxcb
    pkgs.libGL
    pkgs.glib
    pkgs.gtk3
    pkgs.cairo
    pkgs.gdk-pixbuf
    pkgs.atk
    pkgs.pango
    pkgs.openssl
    pkgs.pipewire
    pkgs.mesa
    pkgs.libgbm
  ];

  PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.glib.dev}/lib/pkgconfig:${pkgs.gtk3.dev}/lib/pkgconfig:${pkgs.pipewire.dev}/lib/pkgconfig";

  shellHook = ''
    echo "🚀 RetroStream Rust Development Environment"
    echo "Rust version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
    echo ""
    echo "Quick commands:"
    echo "  cargo run          - Run the application"
    echo "  cargo watch -x run - Auto-reload on changes"
    echo "  cargo build --release - Optimized build"
    echo ""
  '';
}

