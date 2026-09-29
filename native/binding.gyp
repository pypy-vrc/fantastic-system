{
  "targets": [
    {
      "target_name": "native",
      "sources": [],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(module_root_dir)/include/"
      ],
      "defines": [
        "NODE_ADDON_API_CPP_EXCEPTIONS"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        [
          "OS == 'win'",
          {
            "libraries": [
              "d3d11.lib"
            ],
            "sources": [
              "main.cpp"
            ],
            "conditions": [
              [
                "target_arch == 'x64'",
                {
                  "libraries": [
                    "<(module_root_dir)/lib/openvr/win64/openvr_api.lib"
                  ],
                  "copies": [
                    {
                      "files": [
                        "<(module_root_dir)/lib/openvr/win64/openvr_api.dll"
                      ],
                      "destination": "<(PRODUCT_DIR)"
                    }
                  ]
                }
              ]
            ]
          }
        ],
        [
          "OS != 'win'",
          {
            "sources": [
              "main_dummy.cpp"
            ]
          }
        ]
      ]
    }
  ]
}