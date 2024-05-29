{
  'variables': {
    'module_name': 'native',
    'module_path': './build',
    'openssl_fips': ''
  },
  'targets': [
    {
      'target_name': '<(module_name)',
      'defines': [
        'NAPI_DISABLE_CPP_EXCEPTIONS'
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")',
        '<(module_root_dir)/include/'
      ],
      'cflags!': [
        '-fno-exceptions'
      ],
      'cflags_cc!': [
        '-fno-exceptions'
      ],
      'msvs_guid': 'FAE04EC0-301F-11D3-BF4B-00C04F79EFBC',
      'msvs_settings': {
        'VCCLCompilerTool': {
          'ExceptionHandling': 1
        },
      },
      'conditions': [
        [
          'OS == "win"',
          {
            'defines': [
              'WIN32',
              'NDEBUG'
            ],
            'libraries': [
              'd3d11.lib'
            ],
            'sources': [
              'src/main_win.cpp',
            ],
            'conditions': [
              [
                'target_arch == "x64"',
                {
                  'libraries': [
                    '<(module_root_dir)/lib/openvr/win64/openvr_api.lib'
                  ],
                  'copies': [
                    {
                      'files': [
                        '<(module_root_dir)/lib/openvr/win64/openvr_api.dll'
                      ],
                      'destination': '<(module_path)'
                    }
                  ]
                }
              ]
            ]
          }
        ],
        [
          'OS != "win"',
          {
            'sources': [
              'src/main_linux.cpp',
            ]
          }
        ]
      ]
    },
    {
      'target_name': 'action_after_build',
      'type': 'none',
      'dependencies': [
        '<(module_name)'
      ],
      'copies': [
        {
          'files': [
            '<(PRODUCT_DIR)/<(module_name).node',
          ],
          'destination': '<(module_path)'
        }
      ]
    }
  ]
}
