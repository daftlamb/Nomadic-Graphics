LiteGraph.NODE_TEXT_SIZE = 14;
LiteGraph.NODE_TITLE_HEIGHT = 30;
LiteGraph.NODE_WIDGET_HEIGHT = 24;
LiteGraph.NODE_SLOT_HEIGHT = 18;

const UI_FONT = '"Mononoki", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';
const TEXT_FONT_OPTIONS = [
  "Mononoki",
  "Roboto Mono",
  "Space Mono",
  "IBM Plex Mono",
  "JetBrains Mono",
  "Bebas Neue",
  "Anton",
  "Archivo Black",
  "Bungee",
  "Rubik Mono One",
  "Oswald",
  "Staatliches",
  "Press Start 2P",
  "Georgia",
  "Arial",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
  "Impact"
];
const COLOR_PALETTE_OPTIONS = ["Survey", "Warm", "Cool", "Ink", "Pop", "Neon", "Riso", "Candy", "Signal", "Random"];

const DATA_TYPES = {
  audio: "Audio",
  image: "Image",
  shape: "Shape",
  points: "PointSet",
  field: "Field",
  traces: "TraceSet",
  artifact: "Artifact",
  analysis: "Analysis",
  layers: "LayerSet",
  tiles: "TileSet",
  cells: "CellSet",
  selector: "Selector",
  value: "Value",
  array: "Array",
  color: "Color"
};

const ACCEPTS_PREVIEW = "image,shape,points,field,traces,artifact,layers,tiles,cells";

const nodeGroups = [
  {
    name: "Input",
    nodes: [
      {
        type: "nomadic/source/audio_input",
        title: "Audio Input",
        output: "audio",
        description: "Loads an audio clip for rhythm-driven graphics.",
        widgets: [
          ["button", "Load Audio"]
        ]
      },
      {
        type: "nomadic/source/text_shape",
        title: "Text Shape",
        output: "shape",
        description: "Creates a sampled glyph shape.",
        widgets: [
          ["text", "Text", "NOMADIC"],
          ["combo", "Font", "Mononoki", TEXT_FONT_OPTIONS],
          ["slider", "Size", 260, 72, 520],
          ["combo", "Body", "Show", ["Show", "Hide"]]
        ]
      },
      {
        type: "nomadic/source/circle_shape",
        title: "Circle Shape",
        output: "shape",
        description: "Creates a true circular vector shape.",
        widgets: [
          ["slider", "Radius", 210, 80, 310],
          ["slider", "Segments", 96, 16, 240],
          ["combo", "Body", "Show", ["Show", "Hide"]]
        ]
      },
      {
        type: "nomadic/source/rectangle_shape",
        title: "Rectangle Shape",
        output: "shape",
        description: "Creates a rectangular vector field.",
        widgets: [
          ["slider", "Width", 560, 120, 900],
          ["slider", "Height", 320, 80, 620],
          ["slider", "Corner Radius", 0, 0, 180],
          ["combo", "Body", "Show", ["Show", "Hide"]]
        ]
      },
      {
        type: "nomadic/source/polygon_shape",
        title: "Polygon Shape",
        output: "shape",
        description: "Creates a regular polygon vector field.",
        widgets: [
          ["slider", "Sides", 6, 3, 12],
          ["slider", "Radius", 260, 80, 360],
          ["combo", "Body", "Show", ["Show", "Hide"]]
        ]
      },
      {
        type: "nomadic/source/random_points",
        title: "Random Points",
        output: "points",
        description: "Seeds a point set without a parent shape.",
        widgets: [
          ["combo", "Distribution", "Scatter", ["Scatter", "Ring", "Route"]],
          ["slider", "Count", 240, 24, 900],
          ["slider", "Spread", 360, 80, 620]
        ]
      },
      {
        type: "nomadic/source/noise_field",
        title: "Noise Field",
        output: "field",
        description: "Creates a scalar noise field for contouring.",
        widgets: [
          ["combo", "Noise", "Turbulent", ["Simple", "Ridged", "Turbulent"]],
          ["slider", "Scale", 86, 20, 180],
          ["slider", "Contrast", 62, 10, 100]
        ]
      },
      {
        type: "nomadic/source/svg_input",
        title: "SVG Input",
        output: "shape",
        description: "Loads or pastes SVG path data as a sampled shape.",
        widgets: [
          ["button", "Load SVG"],
          ["text", "Path", "M340 250 C470 120 650 120 780 250 C650 380 470 380 340 250 Z"],
          ["combo", "Body", "Show", ["Show", "Hide"]]
        ]
      },
      {
        type: "nomadic/source/image_input",
        title: "Image Input",
        output: "image",
        description: "Loads an image as a visible image layer.",
        widgets: [
          ["button", "Load Image"],
          ["combo", "Blend", "Normal", ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten"]],
          ["slider", "Scale", 100, 40, 260],
          ["slider", "Opacity", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/source/gpt_image",
        title: "GPT Image",
        output: "image",
        description: "Generates a raster image through a local OpenAI-compatible proxy.",
        widgets: [
          ["button", "Generate"],
          ["text", "API URL", "https://yq66.ai"],
          ["text", "Prompt", "A stark black and white editorial poster texture, abstract topographic lines, printed ink grain"],
          ["combo", "Model", "gpt-image-2-pro", ["gpt-image-2-pro", "gpt-image-2", "gpt-image-1", "gpt-image-1-mini", "gpt-image-1.5"]],
          ["combo", "Size", "1024x1024", ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840", "Auto"]],
          ["combo", "Quality", "Medium", ["Auto", "Low", "Medium", "High"]],
          ["combo", "Background", "Opaque", ["Auto", "Opaque", "Transparent"]],
          ["combo", "Cache", "On", ["On", "Off"]],
          ["combo", "Blend", "Normal", ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten"]],
          ["slider", "Scale", 100, 40, 260],
          ["slider", "Opacity", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/source/image_field_input",
        title: "Image Field",
        output: "field",
        description: "Loads an image as a scalar field.",
        widgets: [
          ["button", "Load Image"],
          ["combo", "Channel", "Luma", ["Luma", "Red", "Green", "Blue", "Alpha"]],
          ["combo", "Invert", "Off", ["Off", "On"]],
          ["slider", "Scale", 100, 40, 260],
          ["slider", "Contrast", 62, 10, 100]
        ]
      }
    ]
  },
  {
    name: "Audio",
    nodes: [
      {
        type: "nomadic/audio/magenta_music",
        title: "Magenta Music",
        output: "audio",
        description: "Generates a short music loop through a local Magenta RealTime backend.",
        widgets: [
          ["button", "Generate"],
          ["text", "Prompt", "ambient pulses with glassy synths and soft sub bass"],
          ["combo", "Model", "mrt2_small", ["mrt2_small", "mrt2_base"]],
          ["slider", "Duration", 4, 2, 16],
          ["combo", "Backend", "mlx", ["mlx", "jax"]],
          ["combo", "Cache", "On", ["On", "Off"]]
        ]
      },
      {
        type: "nomadic/audio/features_to_field",
        title: "Audio Features",
        input: "audio",
        output: "field",
        description: "Converts audio amplitude or transients into a scalar field.",
        widgets: [
          ["combo", "Mode", "Amplitude", ["Amplitude", "Onsets", "Waveform"]],
          ["slider", "Columns", 128, 32, 256],
          ["slider", "Rows", 64, 16, 160],
          ["slider", "Contrast", 70, 10, 180],
          ["slider", "Smoothing", 35, 0, 90]
        ]
      }
    ]
  },
  {
    name: "AI",
    nodes: [
      {
        type: "nomadic/ai/gpt_image_edit",
        title: "GPT Image Edit",
        input: "image",
        output: "image",
        description: "Edits an input image through the local OpenAI-compatible proxy.",
        widgets: [
          ["button", "Edit"],
          ["text", "API URL", "https://yq66.ai"],
          ["text", "Prompt", "Change the image into a high fashion editorial poster while preserving the main subject."],
          ["combo", "Model", "gpt-image-2-pro", ["gpt-image-2-pro", "gpt-image-2", "gpt-image-1"]],
          ["combo", "Size", "1024x1024", ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840", "Auto"]],
          ["combo", "Quality", "Medium", ["Auto", "Low", "Medium", "High"]],
          ["combo", "Background", "Opaque", ["Auto", "Opaque", "Transparent"]],
          ["combo", "Cache", "On", ["On", "Off"]],
          ["combo", "Blend", "Normal", ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten"]],
          ["slider", "Scale", 100, 40, 260],
          ["slider", "Opacity", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/ai/box_mask",
        title: "Box Mask",
        input: "image",
        output: "field",
        description: "Creates a precise rectangular mask from normalized image coordinates.",
        widgets: [
          ["slider", "X", 25, 0, 100],
          ["slider", "Y", 20, 0, 100],
          ["slider", "Width", 50, 1, 100],
          ["slider", "Height", 60, 1, 100],
          ["slider", "Feather", 4, 0, 40],
          ["slider", "Strength", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/ai/mobile_sam",
        title: "Mobile SAM",
        inputs: [
          { name: "Image", type: "image" },
          { name: "Box", type: "field", optional: true }
        ],
        output: "field",
        description: "Runs MobileSAM locally with a box prompt and converts the mask into a field.",
        widgets: [
          ["button", "Segment"],
          ["combo", "Model", "MobileSAM Quant", ["MobileSAM Quant"]],
          ["slider", "X", 25, 0, 100],
          ["slider", "Y", 20, 0, 100],
          ["slider", "Width", 50, 1, 100],
          ["slider", "Height", 60, 1, 100],
          ["combo", "Mask Mode", "Largest", ["Largest", "Best", "Union"]],
          ["slider", "Threshold", 50, 0, 100],
          ["slider", "Feather", 3, 0, 28],
          ["slider", "Strength", 100, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Legacy AI",
    nodes: [
      {
        type: "nomadic/ai/vision_judge",
        title: "Vision Judge",
        input: "image",
        output: "analysis",
        description: "Reads an image and returns structured semantic design notes.",
        widgets: [
          ["button", "Analyze"],
          ["text", "API URL", "https://yq66.ai"],
          ["text", "Vision Model", "gpt-4o-mini"],
          ["text", "Question", "Describe the image for graphic design: key subjects, regions, visual texture, and patch ideas."],
          ["combo", "Detail", "Low", ["Low", "High"]]
        ]
      },
      {
        type: "nomadic/ai/semantic_mask",
        title: "Semantic Mask",
        inputs: [
          { name: "Image", type: "image" },
          { name: "Analysis", type: "analysis", optional: true }
        ],
        output: "field",
        description: "Finds a named region in an image and converts it into a soft mask field.",
        widgets: [
          ["button", "Find Region"],
          ["text", "API URL", "https://yq66.ai"],
          ["text", "Vision Model", "gpt-4o-mini"],
          ["text", "Target", "main subject"],
          ["slider", "Feather", 12, 0, 40],
          ["slider", "Strength", 100, 0, 100],
          ["combo", "Detail", "Low", ["Low", "High"]]
        ]
      },
      {
        type: "nomadic/ai/roboflow_sam2",
        title: "Roboflow SAM2",
        inputs: [
          { name: "Image", type: "image" },
          { name: "Box", type: "field", optional: true }
        ],
        output: "field",
        description: "Uses Roboflow SAM2 to turn a box prompt into a precise segmentation mask.",
        widgets: [
          ["button", "Segment"],
          ["text", "API URL", "https://serverless.roboflow.com"],
          ["combo", "Model", "hiera_small", ["hiera_tiny", "hiera_small", "hiera_b_plus", "hiera_large"]],
          ["slider", "X", 25, 0, 100],
          ["slider", "Y", 20, 0, 100],
          ["slider", "Width", 50, 1, 100],
          ["slider", "Height", 60, 1, 100],
          ["slider", "Feather", 3, 0, 28],
          ["slider", "Strength", 100, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Structure",
    nodes: [
      {
        type: "nomadic/geometry/scale_shape",
        title: "Scale Shape",
        inputs: [
          { name: "Shape", type: "shape" },
          { name: "Scale", type: "value", optional: true }
        ],
        output: "shape",
        description: "Rescales and recenters a shape before sampling.",
        widgets: [
          ["combo", "Mode", "Factor", ["Factor", "Fit Canvas"]],
          ["slider", "Scale", 1.4, 0.2, 3.5]
        ]
      },
      {
        type: "nomadic/geometry/mirror",
        title: "Mirror",
        input: ACCEPTS_PREVIEW,
        output: ACCEPTS_PREVIEW,
        description: "Mirrors visual data across the canvas center.",
        widgets: [["combo", "Axis", "Horizontal", ["Horizontal", "Vertical", "Both"]]]
      },
      {
        type: "nomadic/geometry/rotate_mirror",
        title: "Rotate Mirror",
        input: "shape,points,traces,artifact,layers",
        output: "layers",
        description: "Builds radial mirrored copies around the canvas center.",
        widgets: [
          ["slider", "Copies", 6, 2, 18],
          ["slider", "Rotation", 0, -180, 180],
          ["combo", "Alternate", "On", ["On", "Off"]]
        ]
      },
      {
        type: "nomadic/geometry/sample_shape",
        title: "Sample Shape",
        input: "shape",
        output: "points",
        description: "Samples a shape into usable growth points.",
        widgets: [
          ["combo", "Mode", "Boundary", ["Boundary", "Interior", "Mixed"]],
          ["slider", "Count", 360, 60, 900]
        ]
      },
      {
        type: "nomadic/geometry/instance_on_points",
        title: "Instance On Points",
        inputs: [
          { name: "Points", type: "points" },
          { name: "Shape", type: "shape" }
        ],
        output: "layers",
        description: "Places a shape instance on every point.",
        widgets: [
          ["slider", "Scale", 0.22, 0.04, 1.4],
          ["slider", "Jitter", 0, 0, 80],
          ["slider", "Opacity", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/geometry/scanline_field",
        title: "Scanline Field",
        input: "shape",
        output: "traces",
        description: "Cuts a shape into survey-like scanline traces.",
        widgets: [
          ["combo", "Direction", "Horizontal", ["Horizontal", "Vertical"]],
          ["slider", "Spacing", 9, 4, 28],
          ["slider", "Jitter", 2, 0, 18],
          ["slider", "Gaps", 8, 0, 70]
        ]
      },
      {
        type: "nomadic/geometry/distance_field",
        title: "Distance Field",
        input: "shape",
        output: "field",
        description: "Converts shape proximity into a scalar field.",
        widgets: [["slider", "Spread", 70, 24, 160]]
      },
      {
        type: "nomadic/geometry/contour",
        title: "Contour",
        input: "field",
        output: "traces",
        description: "Extracts contour traces from a field.",
        widgets: [["slider", "Levels", 9, 2, 18]]
      },
      {
        type: "nomadic/geometry/offset_contour",
        title: "Offset Contour",
        input: "shape",
        output: "traces",
        description: "Echoes a shape boundary into offset contour rings.",
        widgets: [
          ["slider", "Rings", 8, 1, 24],
          ["slider", "Step", 14, 3, 42],
          ["slider", "Drift", 3, 0, 18]
        ]
      }
    ]
  },
  {
    name: "Utility",
    nodes: [
      {
        type: "nomadic/convert/trace_to_shape",
        title: "Trace To Shape",
        input: "traces",
        output: "shape",
        description: "Turns closed traces into a fillable shape.",
        widgets: [["slider", "Close Gap", 14, 0, 60]]
      },
      {
        type: "nomadic/convert/trace_to_points",
        title: "Trace To Points",
        input: "traces",
        output: "points",
        description: "Samples trace paths into points only.",
        widgets: [
          ["slider", "Spacing", 24, 4, 120],
          ["slider", "Limit", 900, 80, 2200]
        ]
      },
      {
        type: "nomadic/convert/image_to_field",
        title: "Image To Field",
        input: "image",
        output: "field",
        description: "Converts an image layer into a scalar field.",
        widgets: [
          ["combo", "Channel", "Luma", ["Luma", "Red", "Green", "Blue", "Alpha"]],
          ["combo", "Invert", "Off", ["Off", "On"]],
          ["slider", "Contrast", 62, 10, 100]
        ]
      },
      {
        type: "nomadic/convert/shape_to_traces",
        title: "Shape To TraceSet",
        input: "shape",
        output: "traces",
        description: "Converts a shape body into usable trace paths.",
        widgets: [
          ["combo", "Mode", "Boundary", ["Boundary", "Guides", "Hatch"]],
          ["slider", "Density", 52, 8, 100]
        ]
      },
      {
        type: "nomadic/convert/field_mask",
        title: "Field Mask",
        inputs: [
          { name: "Field", type: "field" },
          { name: "Color", type: "color", optional: true }
        ],
        output: "artifact",
        description: "Fills high-value regions from a scalar field.",
        widgets: [
          ["combo", "Mode", "Solid", ["Solid", "Hatch", "Dots"]],
          ["slider", "Threshold", 52, 0, 100],
          ["slider", "Density", 46, 4, 100]
        ]
      },
      {
        type: "nomadic/convert/flatten_layers",
        title: "Flatten Layers",
        input: "layers",
        output: "artifact",
        description: "Bakes a layer stack into a single visual artifact.",
        widgets: []
      },
      {
        type: "nomadic/convert/layers_to_traces",
        title: "Layers To TraceSet",
        input: "layers",
        output: "traces",
        description: "Extracts drawable traces from visible layers.",
        widgets: [["slider", "Field Levels", 7, 2, 18]]
      },
      {
        type: "nomadic/convert/rasterize_layers",
        title: "Rasterize Layers",
        input: "layers",
        output: "field",
        description: "Samples visible layers back into a scalar field.",
        widgets: [
          ["slider", "Detail", 72, 36, 120],
          ["slider", "Sensitivity", 46, 0, 100]
        ]
      },
      {
        type: "nomadic/convert/cells_to_traces",
        title: "Cells To TraceSet",
        input: "cells",
        output: "traces",
        description: "Flattens sliced geometry cells back into trace paths.",
        widgets: []
      }
    ]
  },
  {
    name: "Control",
    nodes: [
      {
        type: "nomadic/field/invert",
        title: "Invert Field",
        input: "field",
        output: "field",
        description: "Inverts scalar field values.",
        widgets: [["slider", "Mix", 100, 0, 100]]
      }
    ]
  },
  {
    name: "Selector",
    nodes: [
      {
        type: "nomadic/selector/noise",
        title: "Noise Selector",
        output: "selector",
        description: "Selects slices with reusable procedural noise.",
        widgets: [
          ["slider", "Threshold", 50, 0, 100],
          ["slider", "Scale", 60, 8, 180],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/selector/row_column",
        title: "Row/Column Selector",
        output: "selector",
        description: "Selects slices by row, column, checkerboard, or border rules.",
        widgets: [
          ["combo", "Mode", "Checkerboard", ["Rows", "Columns", "Checkerboard", "Border", "Center"]],
          ["slider", "Period", 2, 1, 12],
          ["slider", "Offset", 0, 0, 12]
        ]
      },
      {
        type: "nomadic/selector/gradient",
        title: "Gradient Selector",
        output: "selector",
        description: "Selects slices across horizontal, vertical, or radial gradients.",
        widgets: [
          ["combo", "Axis", "Horizontal", ["Horizontal", "Vertical", "Radial"]],
          ["combo", "Invert", "Off", ["Off", "On"]],
          ["slider", "Threshold", 50, 0, 100],
          ["slider", "Softness", 20, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Combine",
    nodes: [
      {
        type: "nomadic/boolean/shape",
        title: "Shape Boolean",
        inputs: [
          { name: "A", type: "shape" },
          { name: "B", type: "shape" }
        ],
        output: "shape",
        description: "Combines two shapes into a new sampled shape.",
        widgets: [
          ["combo", "Mode", "Subtract", ["Union", "Intersect", "Subtract", "Difference"]],
          ["slider", "Detail", 68, 20, 100]
        ]
      },
      {
        type: "nomadic/boolean/field",
        title: "Field Boolean",
        inputs: [
          { name: "A", type: "field" },
          { name: "B", type: "field" }
        ],
        output: "field",
        description: "Combines two scalar fields as data.",
        widgets: [["combo", "Mode", "Max", ["Max", "Min", "Subtract", "Difference"]]]
      }
    ]
  },
  {
    name: "Transform",
    nodes: [
      {
        type: "nomadic/process/growth",
        title: "Growth",
        inputs: [
          { name: "PointSet", type: "points" },
          { name: "Amount", type: "value", optional: true },
          { name: "Length", type: "value", optional: true }
        ],
        output: "traces",
        description: "Grows traces from sampled points.",
        widgets: [
          ["combo", "Mode", "Curve", ["Curve", "Line"]],
          ["slider", "Amount", 68, 12, 100],
          ["slider", "Length", 58, 12, 100]
        ]
      },
      {
        type: "nomadic/process/noise_displace",
        title: "Noise Displace",
        inputs: [
          { name: "TraceSet", type: "traces" },
          { name: "Strength", type: "value", optional: true }
        ],
        output: "traces",
        description: "Disturbs traces with procedural noise.",
        widgets: [
          ["combo", "Noise", "Turbulent", ["Simple", "Ridged", "Turbulent"]],
          ["slider", "Strength", 28, 0, 100],
          ["slider", "Scale", 72, 18, 180]
        ]
      },
      {
        type: "nomadic/process/sine_wave",
        title: "Sine Wave",
        input: "shape,points,traces,artifact,layers",
        output: "shape,points,traces,artifact,layers",
        description: "Bends visual data with a repeating wave.",
        widgets: [
          ["combo", "Axis", "Horizontal", ["Horizontal", "Vertical", "Both"]],
          ["slider", "Amplitude", 34, 0, 160],
          ["slider", "Wavelength", 180, 32, 520],
          ["slider", "Phase", 0, 0, 360]
        ]
      },
      {
        type: "nomadic/process/smooth",
        title: "Smooth",
        input: "traces",
        output: "traces",
        description: "Softens hard trace segments into smoother paths.",
        widgets: [
          ["slider", "Amount", 55, 0, 100],
          ["slider", "Passes", 2, 1, 6]
        ]
      },
      {
        type: "nomadic/process/curve_tension",
        title: "Curve Tension",
        input: "traces",
        output: "traces",
        description: "Changes trace curvature and flow tension.",
        widgets: [
          ["slider", "Tension", 36, 0, 100],
          ["slider", "Sag", 24, -120, 120]
        ]
      },
      {
        type: "nomadic/process/wind",
        title: "Wind",
        input: "traces",
        output: "traces",
        description: "Bends existing traces through a directional force.",
        widgets: [
          ["slider", "Force", 52, 0, 100],
          ["slider", "Angle", 50, 0, 100]
        ]
      },
      {
        type: "nomadic/process/erode",
        title: "Erode",
        input: "traces",
        output: "traces",
        description: "Breaks and roughens traces.",
        widgets: [["slider", "Amount", 42, 0, 100]]
      },
      {
        type: "nomadic/process/dither",
        title: "Dither",
        input: "image,tiles,layers",
        output: "image,layers",
        description: "Applies real raster dithering to images, tile sets, or layer stacks.",
        widgets: [
          ["combo", "Mode", "Bayer", ["Bayer", "Floyd Steinberg", "Halftone"]],
          ["slider", "Threshold", 50, 0, 100],
          ["slider", "Scale", 2, 1, 8],
          ["slider", "Mix", 100, 0, 100]
        ]
      },
      {
        type: "nomadic/process/repeat",
        title: "Repeat",
        input: "shape,points,traces,artifact,layers",
        output: "layers",
        description: "Repeats visual geometry into a layer set.",
        widgets: [
          ["slider", "Count", 5, 1, 18],
          ["slider", "Step X", 72, -260, 260],
          ["slider", "Step Y", 0, -220, 220],
          ["slider", "Scale", 1, 0.45, 1.8],
          ["slider", "Fade", 14, 0, 80]
        ]
      },
      {
        type: "nomadic/process/matrix_repeat",
        title: "Matrix Repeat",
        input: "shape,points,traces,artifact,layers",
        output: "layers",
        description: "Copies visual data across a measured grid.",
        widgets: [
          ["slider", "Columns", 4, 1, 12],
          ["slider", "Rows", 3, 1, 12],
          ["slider", "Step X", 180, 20, 420],
          ["slider", "Step Y", 140, 20, 360],
          ["slider", "Scale", 1, 0.35, 1.8],
          ["slider", "Jitter", 0, 0, 80],
          ["slider", "Fade", 0, 0, 80]
        ]
      },
      {
        type: "nomadic/process/grid_slice",
        title: "Grid Slice",
        input: "image",
        output: "tiles",
        description: "Cuts an image into movable raster tiles.",
        widgets: [
          ["combo", "Mode", "Regular", ["Regular", "Uneven", "Noise Grid"]],
          ["slider", "Columns", 8, 2, 24],
          ["slider", "Rows", 6, 2, 24],
          ["slider", "Gap", 0, 0, 36],
          ["slider", "Crop Padding", 0, 0, 24],
          ["slider", "Jitter", 0, 0, 80],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/shuffle_tiles",
        title: "Shuffle Tiles",
        input: "tiles",
        output: "tiles",
        description: "Reorders image tiles without vectorizing the image.",
        widgets: [
          ["combo", "Mode", "Random", ["Random", "Row Drift", "Column Drift", "Noise Sort", "Reverse"]],
          ["slider", "Amount", 100, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/mix_tiles",
        title: "Mix Tiles",
        inputs: [
          { name: "Tiles A", type: "tiles,layers" },
          { name: "Tiles B", type: "tiles,layers" },
          { name: "Selector", type: "selector", optional: true }
        ],
        output: "tiles",
        description: "Interleaves slices from two image tile sets.",
        widgets: [
          ["combo", "Mode", "Checkerboard", ["Checkerboard", "Random", "Rows", "Columns", "Noise Mask", "Reverse", "Blend"]],
          ["combo", "Layout", "Own Grid", ["Own Grid", "A Grid"]],
          ["combo", "Fit", "Cover", ["Cover", "Contain", "Stretch"]],
          ["slider", "Amount", 50, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/stretch_tiles",
        title: "Stretch Tiles",
        inputs: [
          { name: "TileSet", type: "tiles" },
          { name: "Selector", type: "selector", optional: true }
        ],
        output: "tiles",
        description: "Stretches selected image tiles into smeared raster strips.",
        widgets: [
          ["combo", "Axis", "Horizontal", ["Horizontal", "Vertical", "Mixed"]],
          ["combo", "Anchor", "Center", ["Left", "Center", "Right"]],
          ["combo", "Pixel Mode", "Smear", ["Smooth", "Hard Pixel", "Smear"]],
          ["slider", "Amount", 120, 0, 320],
          ["slider", "Chance", 42, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/trace_slice",
        title: "Trace Slice",
        input: "traces",
        output: "cells",
        description: "Cuts trace geometry into movable map cells.",
        widgets: [
          ["combo", "Mode", "Regular", ["Regular", "Uneven", "Noise Grid"]],
          ["slider", "Columns", 8, 2, 24],
          ["slider", "Rows", 6, 2, 24],
          ["slider", "Gap", 0, 0, 36],
          ["slider", "Clip Padding", 0, 0, 36],
          ["slider", "Jitter", 0, 0, 80],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/shuffle_cells",
        title: "Shuffle Cells",
        input: "cells",
        output: "cells",
        description: "Reorders sliced trace cells like displaced map fragments.",
        widgets: [
          ["combo", "Mode", "Random", ["Random", "Row Drift", "Column Drift", "Noise Sort", "Reverse"]],
          ["slider", "Amount", 100, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/process/stretch_cells",
        title: "Stretch Cells",
        input: "cells",
        output: "cells",
        description: "Stretches selected trace cells and the lines inside them.",
        widgets: [
          ["combo", "Axis", "Horizontal", ["Horizontal", "Vertical", "Mixed"]],
          ["combo", "Anchor", "Center", ["Left", "Center", "Right"]],
          ["slider", "Amount", 120, 0, 320],
          ["slider", "Chance", 42, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Material",
    nodes: [
      {
        type: "nomadic/material/image_weathering",
        title: "Image Weathering",
        input: "image,tiles,layers",
        output: "image,layers",
        description: "Ages raster images, tile sets, or labeled layers with paper, photocopy, toner, and transfer artifacts.",
        widgets: [
          ["combo", "Mode", "Photocopy", ["Photocopy", "Print Transfer", "Newsprint", "Archive Dust"]],
          ["combo", "Tone", "Neutral", ["Neutral", "Tint", "Duotone"]],
          ["combo", "Ink Color", "Signal Red", ["Signal Red", "Vermilion", "Ink", "Moss", "Water", "Clay"]],
          ["combo", "Paper Color", "Paper", ["Paper", "White", "Sand", "Moss", "Water", "Clay"]],
          ["slider", "Tone Amount", 0, 0, 100],
          ["slider", "Exposure", 0, -80, 80],
          ["slider", "Contrast", 72, 0, 100],
          ["slider", "Grain", 46, 0, 100],
          ["slider", "Dust", 30, 0, 100],
          ["slider", "Paper", 52, 0, 100],
          ["slider", "Fade", 16, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/material/graffiti_stroke",
        title: "Graffiti Stroke",
        input: "image,shape,traces,artifact,layers",
        output: "image",
        description: "Redraws visual data as soft hand-made marker ink.",
        widgets: [
          ["combo", "Mode", "Edge", ["Edge", "Source", "Solid"]],
          ["combo", "Color", "Signal Red", ["Signal Red", "Vermilion", "Ink", "Moss", "Random"]],
          ["slider", "Width", 18, 4, 56],
          ["slider", "Wobble", 42, 0, 100],
          ["slider", "Repeat", 3, 1, 8],
          ["slider", "Bleed", 46, 0, 100],
          ["slider", "Grain", 38, 0, 100],
          ["slider", "Softness", 34, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Style",
    nodes: [
      {
        type: "nomadic/style/color",
        title: "Color",
        output: "color",
        description: "Outputs a reusable ink color.",
        widgets: [
          ["combo", "Palette", "Moss", ["Ink", "Moss", "Water", "Clay", "Sand", "Paper", "Signal Red", "Vermilion", "Lemon", "Cyan", "Magenta", "Random"]],
          ["slider", "Seed", 0, 0, 100],
          ["slider", "Opacity", 72, 0, 100]
        ]
      },
      {
        type: "nomadic/style/fill_area",
        title: "Fill Area",
        inputs: [
          { name: "In", type: "shape,field,traces,layers" },
          { name: "Color", type: "color", optional: true }
        ],
        output: "artifact,layers",
        description: "Fills a shape, field, closed trace set, or layer set.",
        widgets: [
          ["combo", "Mode", "Solid", ["Solid", "Hatch", "Dots"]],
          ["slider", "Density", 46, 4, 100],
          ["slider", "Threshold", 52, 0, 100]
        ]
      },
      {
        type: "nomadic/style/stroke_style",
        title: "Stroke Style",
        inputs: [
          { name: "TraceSet", type: "traces" },
          { name: "Color", type: "color", optional: true },
          { name: "Width", type: "value", optional: true }
        ],
        output: "traces",
        description: "Changes trace width, opacity, and ink color.",
        widgets: [
          ["slider", "Width", 1.2, 0.2, 8],
          ["slider", "Opacity", 68, 0, 100]
        ]
      },
      {
        type: "nomadic/style/ink_distress",
        title: "Ink Distress",
        input: "shape,field,traces,artifact,layers",
        output: "artifact,layers",
        description: "Degrades geometry into rough low-quality print ink.",
        widgets: [
          ["combo", "Mode", "Photocopy", ["Dry", "Wet", "Cheap Print", "Riso", "Photocopy", "Block Print", "Pixel Stamp"]],
          ["slider", "Threshold", 52, 0, 100],
          ["slider", "Block Size", 9, 2, 34],
          ["slider", "Distress", 46, 0, 100],
          ["slider", "Grain", 58, 0, 100],
          ["slider", "Bleed", 24, 0, 100],
          ["slider", "Pressure", 70, 0, 100],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/style/random_stroke_color",
        title: "Random Color",
        input: "image,tiles,cells,shape,traces,artifact,layers",
        output: "image,tiles,cells,shape,traces,artifact,layers",
        description: "Assigns vivid palette colors to raster, tile, cell, stroke, and fill data.",
        widgets: [
          ["combo", "Target", "Both", ["Both", "Stroke", "Fill"]],
          ["combo", "Palette", "Pop", COLOR_PALETTE_OPTIONS],
          ["slider", "Variation", 76, 0, 100],
          ["slider", "Seed", 0, 0, 100],
          ["slider", "Opacity", 68, 0, 100]
        ]
      },
      {
        type: "nomadic/style/random_size",
        title: "Random Size",
        input: "shape,points,traces,artifact,layers",
        output: "shape,points,traces,artifact,layers",
        description: "Assigns varied scale to points, layers, and visual data.",
        widgets: [
          ["slider", "Min", 45, 5, 160],
          ["slider", "Max", 140, 10, 260],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/style/point_labels",
        title: "Point Labels",
        inputs: [
          { name: "Points", type: "points" },
          { name: "Array", type: "array", optional: true },
          { name: "Color", type: "color", optional: true }
        ],
        output: "artifact",
        description: "Places number strings at point locations.",
        widgets: [
          ["slider", "Size", 9, 4, 28],
          ["slider", "Offset", 8, 0, 42],
          ["slider", "Limit", 900, 20, 2200],
          ["slider", "Opacity", 80, 0, 100]
        ]
      },
      {
        type: "nomadic/style/layer_labels",
        title: "Layer Labels",
        inputs: [
          { name: "Layers", type: "layers" },
          { name: "Array", type: "array", optional: true },
          { name: "Color", type: "color", optional: true }
        ],
        output: "layers",
        description: "Places array values on every layer in a repeated stack.",
        widgets: [
          ["combo", "Align", "Center", ["Center", "Left", "Right"]],
          ["slider", "Size", 18, 6, 56],
          ["slider", "Padding", 0, 0, 96],
          ["combo", "Color Mode", "Input", ["Input", "Random", "Ink", "Moss", "Water", "Clay", "Sand", "Paper"]],
          ["combo", "Palette", "Survey", ["Survey", "Warm", "Cool", "Ink", "Random"]],
          ["slider", "Seed", 0, 0, 100],
          ["slider", "Opacity", 90, 0, 100]
        ]
      },
      {
        type: "nomadic/style/slice_labels",
        title: "Slice Labels",
        inputs: [
          { name: "Slices", type: "tiles,cells" },
          { name: "Array", type: "array", optional: true },
          { name: "Color", type: "color", optional: true }
        ],
        output: "layers",
        description: "Maps text characters onto existing image tiles or trace cells.",
        widgets: [
          ["text", "Text", "POISON GIRL FRIENDS"],
          ["combo", "Mapping", "Skip Spaces", ["Skip Spaces", "Keep Spaces", "Rows From Spaces", "Array Values", "Index"]],
          ["combo", "Fit", "Fit Tile", ["Fit Tile", "Uniform", "Manual"]],
          ["combo", "Font", "Mononoki", TEXT_FONT_OPTIONS],
          ["slider", "Size", 120, 8, 420],
          ["slider", "Padding", 18, 0, 120],
          ["slider", "Offset X", 0, -180, 180],
          ["slider", "Offset Y", 0, -180, 180],
          ["slider", "Rotation", 0, -45, 45],
          ["combo", "Color Mode", "Input", ["Input", "Random", "Ink", "Moss", "Water", "Clay", "Sand", "Paper"]],
          ["combo", "Palette", "Survey", ["Survey", "Warm", "Cool", "Ink", "Random"]],
          ["slider", "Seed", 0, 0, 100],
          ["slider", "Opacity", 96, 0, 100]
        ]
      }
    ]
  },
  {
    name: "Math",
    nodes: [
      {
        type: "nomadic/math/random_array",
        title: "Random Array",
        output: "array",
        description: "Outputs a reusable array of random number strings.",
        widgets: [
          ["slider", "Count", 900, 10, 2200],
          ["slider", "Digits", 4, 1, 8],
          ["slider", "Seed", 0, 0, 100]
        ]
      },
      {
        type: "nomadic/math/value",
        title: "Value",
        output: "value",
        description: "Outputs a reusable numeric value.",
        widgets: [["slider", "Value", 50, -200, 200]]
      },
      {
        type: "nomadic/math/add",
        title: "Add",
        inputs: [
          { name: "A", type: "value" },
          { name: "B", type: "value", optional: true }
        ],
        output: "value",
        description: "Adds two values.",
        widgets: [["slider", "Fallback B", 10, -200, 200]]
      },
      {
        type: "nomadic/math/subtract",
        title: "Subtract",
        inputs: [
          { name: "A", type: "value" },
          { name: "B", type: "value", optional: true }
        ],
        output: "value",
        description: "Subtracts B from A.",
        widgets: [["slider", "Fallback B", 10, -200, 200]]
      },
      {
        type: "nomadic/math/multiply",
        title: "Multiply",
        inputs: [
          { name: "A", type: "value" },
          { name: "B", type: "value", optional: true }
        ],
        output: "value",
        description: "Multiplies two values.",
        widgets: [["slider", "Fallback B", 2, -20, 20]]
      },
      {
        type: "nomadic/math/divide",
        title: "Divide",
        inputs: [
          { name: "A", type: "value" },
          { name: "B", type: "value", optional: true }
        ],
        output: "value",
        description: "Divides A by B.",
        widgets: [["slider", "Fallback B", 2, -20, 20]]
      }
    ]
  },
  {
    name: "Output",
    nodes: [
      {
        type: "nomadic/output/layer_stack",
        title: "Layer Stack",
        inputs: [
          { name: "A", type: ACCEPTS_PREVIEW },
          { name: "B", type: ACCEPTS_PREVIEW }
        ],
        output: "layers",
        description: "Combines two visual data streams before preview.",
        widgets: [
          ["slider", "Opacity A", 100, 0, 100],
          ["slider", "Opacity B", 78, 0, 100],
          ["combo", "Blend B", "Source", ["Source", "Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten"]]
        ]
      },
      {
        type: "nomadic/output/preview",
        title: "Preview",
        input: ACCEPTS_PREVIEW,
        description: "Renders the connected data object.",
        widgets: [
          ["combo", "Background", "Paper", ["Paper", "White", "Dark", "Custom", "Transparent"]],
          ["text", "Background Color", "#f8f5eb"],
          ["combo", "Grid", "On", ["On", "Off"]],
          ["combo", "Canvas Size", "Default", ["Default", "From Image", "Square", "16:9", "4:5", "Custom"]],
          ["slider", "Width", 1100, 256, 2400],
          ["slider", "Height", 760, 256, 2400],
          ["combo", "Fit", "Crop", ["Crop", "Fit Content"]],
          ["combo", "Export Scale", "2x", ["1x", "2x", "4x"]]
        ],
        preview: true
      }
    ]
  }
];

const nodeDefs = new Map(nodeGroups.flatMap((group) => group.nodes.map((node) => [node.type, { ...node, group: group.name }])));
const PATCH_STORAGE_KEY = "nomadic-graphics.patch.v1";
const THEME_STORAGE_KEY = "nomadic-graphics.theme";
const PANEL_STATE_STORAGE_KEY = "nomadic-graphics.panels";
const API_KEY_STORAGE_KEY = "nomadic-graphics.api-key";
const ROBOFLOW_API_KEY_STORAGE_KEY = "nomadic-graphics.roboflow-api-key";
const GPT_IMAGE_CACHE_DB = "nomadic-graphics-cache";
const GPT_IMAGE_CACHE_STORE = "gpt_images";
const MAGENTA_AUDIO_PROXY_URL = "http://127.0.0.1:8788/magenta/generate";
const OPENAI_IMAGE_PROXY_URL = "http://127.0.0.1:8788/openai/image";
const OPENAI_IMAGE_EDIT_PROXY_URL = "http://127.0.0.1:8788/openai/image-edit";
const OPENAI_CHAT_PROXY_URL = "http://127.0.0.1:8788/openai/chat";
const ROBOFLOW_SAM2_PROXY_URL = "http://127.0.0.1:8788/roboflow/sam2";
const MOBILE_SAM_ENCODER_URL = "vendor/mobilesam/mobilesam.encoder.onnx";
const MOBILE_SAM_DECODER_URL = "vendor/mobilesam/mobilesam.decoder.quant.onnx";
const MOBILE_SAM_ORT_URL = "vendor/ort/ort.wasm.min.js";
const MOBILE_SAM_WASM_PATH = "vendor/ort/";
const UNDO_LIMIT = 80;
const LINK_INSERT_HIT_TARGET_PX = 24;
const LINK_DROP_HIT_TARGET_PX = 46;
const LINK_HIT_SAMPLE_COUNT = 32;

const state = {
  seed: 7,
  selectedNode: null,
  selectedLinkId: null,
  hoveredLinkId: null,
  highlightedInsertLinkId: null,
  lastCanvasPoint: null,
  lastContextPoint: null,
  lastPreview: null,
  lastPreviewOptions: {},
  addCounts: {},
  libraryMode: "Process",
  libraryCollapsed: false,
  inspectorCollapsed: false,
  collapsedLibraryGroups: new Set(),
  theme: "paper",
  undoStack: [],
  undoIndex: -1,
  undoTimer: null,
  lastUndoSnapshot: "",
  isRestoring: false,
  draggingNodeForInsert: null,
  openaiApiKey: null,
  mobileSamRuntime: null
};

const graphCanvasElement = document.querySelector("#graphCanvas");
const appShell = document.querySelector(".app-shell");
const inspectorPreview = document.querySelector("#inspectorPreview");
const nodeLibrary = document.querySelector("#nodeLibrary");
const workflowTitle = document.querySelector("#workflowTitle");
const selectedNodeName = document.querySelector("#selectedNodeName");
const nodeDescription = document.querySelector("#nodeDescription");
const outputTraits = document.querySelector("#outputTraits");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");
const savePatchButton = document.querySelector("#savePatchButton");
const loadPatchButton = document.querySelector("#loadPatchButton");
const exportPatchButton = document.querySelector("#exportPatchButton");
const openPatchButton = document.querySelector("#openPatchButton");
const themeSelect = document.querySelector("#themeSelect");
const toggleLibraryPanel = document.querySelector("#toggleLibraryPanel");
const toggleInspectorPanel = document.querySelector("#toggleInspectorPanel");

let graph;
let graphCanvas;

function registerNomadicNodes() {
  for (const def of nodeDefs.values()) {
    if (LiteGraph.registered_node_types[def.type]) continue;

    function NomadicNode() {
      this.properties = defaultsFor(def);
      inputDefsFor(def).forEach((input) => this.addInput(input.name || inputLabel(input.type), input.type));
      if (def.output) this.addOutput(outputLabel(def.output), outputType(def.output));
      this.size = def.preview ? [720, 560] : nodeSizeFor(def);
      this.color = colorForGroup(def.group);
      this.bgcolor = "#f8f5eb";
      this.boxcolor = "#d8d1c0";
      this.lastOutput = null;
      addWidgets(this, def);
    }

    NomadicNode.title = def.title;

    NomadicNode.prototype.onExecute = function () {
      if (def.preview) {
        this.lastOutput = this.getInputData(0) || null;
        state.lastPreview = this.lastOutput || state.lastPreview;
        state.lastPreviewOptions = { ...this.properties };
        resizePreviewNodeToArtboard(this, this.lastOutput, def);
        return;
      }
      const inputs = inputDefsFor(def).map((_, index) => this.getInputData(index) || null);
      const hasMissingRequired = inputDefsFor(def).some((input, index) => !input.optional && !inputs[index]);
      if (hasMissingRequired) {
        this.lastOutput = null;
        if (def.output) this.setOutputData(0, null);
        return;
      }
      const output = runNode(def, inputs, this.properties);
      this.lastOutput = output;
      this.setOutputData(0, output);
    };

    NomadicNode.prototype.onDrawForeground = function (ctx) {
      drawNodeStatus(ctx, this, def);
      if (def.preview) {
        const top = 48 + (def.widgets || []).length * 30;
        NomadicGeometry.draw(ctx, this.lastOutput, {
          x: 12,
          y: top,
          width: this.size[0] - 24,
          height: this.size[1] - top - 12,
          background: this.properties.background,
          backgroundColor: this.properties.background_color,
          grid: this.properties.grid,
          canvasSize: this.properties.canvas_size,
          artboardWidth: this.properties.width,
          artboardHeight: this.properties.height,
          fit: this.properties.fit
        });
      }
    };

    NomadicNode.prototype.computeSize = function () {
      return def.preview ? [720, 560] : nodeSizeFor(def);
    };

    NomadicNode.prototype.onResize = function (size) {
      if (!def.preview) return;
      size[0] = Math.max(320, size[0]);
      size[1] = Math.max(420, size[1]);
    };

    NomadicNode.prototype.onAdded = function () {
      if (def.preview) this.size = [720, 560];
    };

    NomadicNode.prototype.onConnectionsChange = function () {
      window.setTimeout(runGraphOnce, 0);
    };

    LiteGraph.registerNodeType(def.type, NomadicNode);
  }
}

function defaultsFor(def) {
  const defaults = { type: def.type };
  if (!def.preview) defaults.bypass = "Off";
  (def.widgets || []).forEach(([kind, name, value]) => {
    if (kind === "button") return;
    defaults[keyForWidget(name)] = value;
  });
  return defaults;
}

function addWidgets(node, def) {
  if (!def.preview) {
    node.addWidget("combo", "Bypass", node.properties.bypass, (nextValue) => {
      node.properties.bypass = nextValue || "Off";
      runGraphOnce();
      scheduleUndoSnapshot();
    }, { values: ["Off", "On"] });
  }
  (def.widgets || []).forEach(([kind, name, value, minOrValues, max]) => {
    const key = keyForWidget(name);
    if (kind === "combo") {
      node.addWidget("combo", name, value, (nextValue) => {
        node.properties[key] = nextValue;
        handleNodeWidgetChange(node, def, name);
        runGraphOnce();
        scheduleUndoSnapshot();
      }, { values: minOrValues });
      return;
    }
    if (kind === "button") {
      node.addWidget("button", name, null, () => handleNodeButton(node, def, name));
      return;
    }
    node.addWidget(kind, name, value, (nextValue) => {
      node.properties[key] = nextValue;
      handleNodeWidgetChange(node, def, name);
      runGraphOnce();
      scheduleUndoSnapshot();
    }, kind === "slider" ? { min: minOrValues, max } : undefined);
  });
}

function keyForWidget(name) {
  return name.toLowerCase().replace(/\s+/g, "_");
}

function nodeSizeFor(def) {
  const height = 92 + (def.widgets || []).length * 30 + (def.preview ? 0 : 30) + (inputDefsFor(def).length ? 16 : 0);
  return [248, height];
}

function resizePreviewNodeToArtboard(node, data, def) {
  const artboard = previewArtboard(node.properties, data);
  const aspect = clampNumber(artboard.width / Math.max(1, artboard.height), 0.22, 2.4);
  const top = 48 + (def.widgets || []).length * 30;
  let contentWidth;
  let contentHeight;

  if (aspect < 0.82) {
    contentHeight = 820;
    contentWidth = Math.max(280, Math.round(contentHeight * aspect));
  } else {
    contentWidth = 720;
    contentHeight = Math.round(contentWidth / aspect);
  }

  contentWidth = clampNumber(contentWidth, 280, 760);
  contentHeight = clampNumber(contentHeight, 360, 820);
  const nextSize = [Math.round(contentWidth + 24), Math.round(contentHeight + top + 12)];
  const changed = Math.abs(node.size[0] - nextSize[0]) > 4 || Math.abs(node.size[1] - nextSize[1]) > 4;
  if (!changed) return;
  if (typeof node.setSize === "function") node.setSize(nextSize);
  else node.size = nextSize;
  graphCanvas?.setDirty(true, true);
}

function previewArtboard(options = {}, data = null) {
  const preset = options.canvas_size || "Default";
  if (preset === "From Image") {
    const bounds = firstImageBounds(data) || dataBounds(data);
    if (bounds) {
      return {
        width: Math.max(1, bounds.maxX - bounds.minX),
        height: Math.max(1, bounds.maxY - bounds.minY),
        bounds
      };
    }
  }
  const presetSizes = {
    Default: [NomadicGeometry.WIDTH, NomadicGeometry.HEIGHT],
    Square: [1080, 1080],
    "16:9": [1920, 1080],
    "4:5": [1080, 1350]
  };
  const [presetWidth, presetHeight] = presetSizes[preset] || [Number(options.width || NomadicGeometry.WIDTH), Number(options.height || NomadicGeometry.HEIGHT)];
  const width = Math.max(1, Number(preset === "Custom" ? options.width : presetWidth) || NomadicGeometry.WIDTH);
  const height = Math.max(1, Number(preset === "Custom" ? options.height : presetHeight) || NomadicGeometry.HEIGHT);
  return { width, height };
}

function firstImageBounds(data) {
  const image = firstImageData(data);
  if (!image) return null;
  const minX = Number(image.originX ?? 0);
  const minY = Number(image.originY ?? 0);
  return {
    minX,
    minY,
    maxX: minX + Number(image.width || NomadicGeometry.WIDTH),
    maxY: minY + Number(image.height || NomadicGeometry.HEIGHT)
  };
}

function firstImageData(data) {
  if (!data) return null;
  if (data.ngType === "Image") return data;
  if (data.ngType === "LayerSet") {
    for (const layer of data.layers || []) {
      const image = firstImageData(layer.data);
      if (image) return image;
    }
  }
  return null;
}

function isImageDerivedData(data) {
  if (!data) return false;
  if (data.ngType === "Image") return true;
  if (data.ngType === "TileSet") return true;
  if ((data.history || []).join(" / ").includes("Image Input")) return true;
  if (data.ngType === "LayerSet") return (data.layers || []).some((layer) => isImageDerivedData(layer.data));
  return false;
}

function dataBounds(data) {
  if (!data) return null;
  if (data.ngType === "LayerSet") return unionDataBounds((data.layers || []).map((layer) => dataBounds(layer.data)));
  if (data.ngType === "Image") {
    const minX = Number(data.originX ?? 0);
    const minY = Number(data.originY ?? 0);
    return {
      minX,
      minY,
      maxX: minX + Number(data.width || NomadicGeometry.WIDTH),
      maxY: minY + Number(data.height || NomadicGeometry.HEIGHT)
    };
  }
  if (data.ngType === "TileSet") {
    return data.bounds || unionDataBounds((data.tiles || []).map((tile) => ({
      minX: Number(tile.x || 0),
      minY: Number(tile.y || 0),
      maxX: Number(tile.x || 0) + Number(tile.w || 0),
      maxY: Number(tile.y || 0) + Number(tile.h || 0)
    })));
  }
  if (data.ngType === "CellSet") {
    return data.bounds || unionDataBounds((data.cells || []).map((cell) => ({
      minX: Number(cell.x || 0),
      minY: Number(cell.y || 0),
      maxX: Number(cell.x || 0) + Number(cell.w || 0),
      maxY: Number(cell.y || 0) + Number(cell.h || 0)
    })));
  }
  if (data.ngType === "Field") {
    const minX = Number(data.originX ?? 0);
    const minY = Number(data.originY ?? 0);
    return {
      minX,
      minY,
      maxX: minX + Number(data.width || NomadicGeometry.WIDTH),
      maxY: minY + Number(data.height || NomadicGeometry.HEIGHT)
    };
  }
  if (data.ngType === "Shape") return data.bounds || boundsFromPoints((data.boundary || []).concat(data.fill || []));
  if (data.ngType === "PointSet") return unionDataBounds([boundsFromPoints(data.points || []), dataBounds(data.sourceShape)]);
  if (data.ngType === "TraceSet") return unionDataBounds([boundsFromPaths(data.paths || []), dataBounds(data.sourceShape)]);
  if (data.ngType === "Artifact") {
    return unionDataBounds([
      boundsFromPoints(data.marks || []),
      boundsFromPoints(data.labels || []),
      boundsFromPaths(data.paths || []),
      boundsFromPaths((data.fills || []).flatMap((fill) => fill.contours || [])),
      dataBounds(data.sourceShape)
    ]);
  }
  return null;
}

function unionDataBounds(boundsList) {
  const valid = boundsList.filter((bounds) => bounds && Number.isFinite(bounds.minX));
  if (!valid.length) return null;
  return {
    minX: Math.min(...valid.map((bounds) => bounds.minX)),
    minY: Math.min(...valid.map((bounds) => bounds.minY)),
    maxX: Math.max(...valid.map((bounds) => bounds.maxX)),
    maxY: Math.max(...valid.map((bounds) => bounds.maxY))
  };
}

function boundsFromPaths(paths) {
  return boundsFromPoints((paths || []).flat());
}

function boundsFromPoints(points) {
  const valid = (points || []).filter((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y));
  if (!valid.length) return null;
  return {
    minX: Math.min(...valid.map((pt) => pt.x)),
    minY: Math.min(...valid.map((pt) => pt.y)),
    maxX: Math.max(...valid.map((pt) => pt.x)),
    maxY: Math.max(...valid.map((pt) => pt.y))
  };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inputDefsFor(def) {
  if (def.inputs) return def.inputs;
  if (def.input) return [{ name: inputLabel(def.input), type: def.input }];
  return [];
}

function inputLabel(type) {
  return type.includes(",") ? "In" : DATA_TYPES[type] || type;
}

function readableType(type) {
  if (!type) return "";
  return type
    .split(",")
    .map((item) => DATA_TYPES[item] || item)
    .join(" / ");
}

function outputType(type) {
  return type;
}

function outputLabel(type) {
  if (type.includes(",")) return "Data";
  return DATA_TYPES[type] || readableType(type);
}

function colorForGroup(group) {
  return {
    Source: "#5f6f5d",
    Geometry: "#4f6a72",
    Convert: "#5f6670",
    Field: "#4f6372",
    Boolean: "#6f5f76",
    Process: "#75684d",
    Material: "#6b6559",
    Style: "#6f625f",
    Math: "#655f76",
    Output: "#456c7c"
  }[group] || "#536b57";
}

function runNode(def, inputs, props) {
  const input = inputs[0] || null;
  if (props.bypass === "On") return input ? bypassData(input, def.title) : null;
  if (def.type === "nomadic/source/audio_input" || def.type === "nomadic/audio/magenta_music") {
    return audioFromProperties(props);
  }
  if (def.type === "nomadic/source/text_shape") {
    return NomadicGeometry.createTextShape({
      text: props.text,
      font: props.font,
      size: props.size,
      body: props.body
    }, state.seed);
  }
  if (def.type === "nomadic/source/circle_shape") {
    return NomadicGeometry.createCircleShape({
      radius: props.radius,
      segments: props.segments,
      body: props.body
    });
  }
  if (def.type === "nomadic/source/rectangle_shape") {
    return NomadicGeometry.createRectangleShape({
      width: props.width,
      height: props.height,
      cornerRadius: props.corner_radius,
      body: props.body
    });
  }
  if (def.type === "nomadic/source/polygon_shape") {
    return NomadicGeometry.createPolygonShape({ sides: props.sides, radius: props.radius, body: props.body });
  }
  if (def.type === "nomadic/source/random_points") {
    return NomadicGeometry.createRandomPoints({
      distribution: props.distribution,
      count: props.count,
      spread: props.spread
    }, state.seed);
  }
  if (def.type === "nomadic/source/noise_field") {
    return NomadicGeometry.createNoiseField({
      noise: props.noise,
      scale: props.scale,
      contrast: props.contrast
    }, state.seed);
  }
  if (def.type === "nomadic/source/svg_input") {
    return NomadicGeometry.createSvgShape({
      path: props.path,
      body: props.body
    });
  }
  if (def.type === "nomadic/source/image_input") {
    return NomadicGeometry.createImageLayer({
      dataUrl: props.image_data_url,
      pixels: props.image_raster_pixels || props.image_pixels,
      cols: props.image_raster_cols || props.image_cols,
      rows: props.image_raster_rows || props.image_rows,
      originalWidth: props.image_original_width,
      originalHeight: props.image_original_height,
      label: props.image_label,
      blend: props.blend,
      scale: props.scale,
      opacity: props.opacity
    });
  }
  if (def.type === "nomadic/source/gpt_image") {
    const layer = NomadicGeometry.createImageLayer({
      dataUrl: props.image_data_url,
      pixels: props.image_raster_pixels || props.image_pixels,
      cols: props.image_raster_cols || props.image_cols,
      rows: props.image_raster_rows || props.image_rows,
      originalWidth: props.image_original_width,
      originalHeight: props.image_original_height,
      label: props.image_label || "GPT Image",
      blend: props.blend,
      scale: props.scale,
      opacity: props.opacity
    });
    if (layer) {
      layer.label = props.image_label || "GPT Image";
      layer.history = ["GPT Image"];
      layer.stats = {
        ...(layer.stats || {}),
        model: normalizeImageModel(props.model, props.api_url),
        size: props.size || "1024x1024",
        quality: props.quality || "Medium"
      };
    }
    return layer;
  }
  if (def.type === "nomadic/ai/gpt_image_edit") {
    const layer = NomadicGeometry.createImageLayer({
      dataUrl: props.image_data_url,
      pixels: props.image_raster_pixels || props.image_pixels,
      cols: props.image_raster_cols || props.image_cols,
      rows: props.image_raster_rows || props.image_rows,
      originalWidth: props.image_original_width,
      originalHeight: props.image_original_height,
      label: props.image_label || "GPT Image Edit",
      blend: props.blend,
      scale: props.scale,
      opacity: props.opacity
    });
    if (layer) {
      layer.label = props.image_label || "GPT Image Edit";
      layer.history = ["GPT Image Edit"];
      layer.stats = {
        ...(layer.stats || {}),
        model: normalizeImageModel(props.model, props.api_url),
        size: props.size || "1024x1024",
        quality: props.quality || "Medium"
      };
    }
    return layer;
  }
  if (def.type === "nomadic/ai/vision_judge") {
    return analysisFromProperties(props, "Vision Judge");
  }
  if (def.type === "nomadic/ai/semantic_mask") {
    const analysis = inputs[1] || analysisFromProperties(props, "Semantic Mask");
    return semanticMaskField(inputs[0], analysis, {
      target: props.target,
      feather: props.feather,
      strength: props.strength
    });
  }
  if (def.type === "nomadic/ai/box_mask") {
    return boxMaskField(inputs[0], {
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
      feather: props.feather,
      strength: props.strength
    });
  }
  if (def.type === "nomadic/ai/roboflow_sam2") {
    return roboflowSam2Field(inputs[0], props, {
      boxField: inputs[1],
      feather: props.feather,
      strength: props.strength
    });
  }
  if (def.type === "nomadic/ai/mobile_sam") {
    return mobileSamFieldFromProperties(inputs[0], props, {
      feather: props.feather,
      strength: props.strength
    });
  }
  if (def.type === "nomadic/audio/features_to_field") {
    return audioFeatureField(inputs[0], props);
  }
  if (def.type === "nomadic/source/image_field_input") {
    return NomadicGeometry.createImageField({
      pixels: props.image_pixels,
      cols: props.image_cols,
      rows: props.image_rows,
      label: props.image_label,
      channel: props.channel,
      invert: props.invert,
      contrast: props.contrast,
      scale: props.scale,
      rectX: props.image_rect_x,
      rectY: props.image_rect_y,
      rectWidth: props.image_rect_width,
      rectHeight: props.image_rect_height
    });
  }
  if (def.type === "nomadic/math/random_array") {
    return NomadicGeometry.createRandomArray({
      count: props.count,
      digits: props.digits,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/math/value") {
    return NomadicGeometry.createValue({ value: props.value });
  }
  if (def.type.startsWith("nomadic/math/")) {
    return NomadicGeometry.mathValue(inputs[0], inputs[1], {
      operation: def.title,
      fallbackB: props.fallback_b
    });
  }
  if (def.type === "nomadic/geometry/scale_shape") {
    return NomadicGeometry.scaleShape(input, {
      mode: props.mode,
      scale: props.scale,
      scaleValue: inputs[1]
    });
  }
  if (def.type === "nomadic/geometry/mirror") {
    return NomadicGeometry.mirrorData(input, { axis: props.axis });
  }
  if (def.type === "nomadic/geometry/rotate_mirror") {
    return NomadicGeometry.rotateMirror(input, {
      copies: props.copies,
      rotation: props.rotation,
      alternate: props.alternate
    });
  }
  if (def.type === "nomadic/geometry/sample_shape") {
    return NomadicGeometry.sampleShape(input, { mode: props.mode, count: props.count }, state.seed);
  }
  if (def.type === "nomadic/geometry/instance_on_points") {
    return NomadicGeometry.instanceOnPoints(inputs[0], inputs[1], {
      scale: props.scale,
      jitter: props.jitter,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/geometry/scanline_field") {
    return NomadicGeometry.scanlineField(input, {
      direction: props.direction,
      spacing: props.spacing,
      jitter: props.jitter,
      gaps: props.gaps
    }, state.seed);
  }
  if (def.type === "nomadic/geometry/distance_field") {
    return NomadicGeometry.distanceField(input, { spread: props.spread });
  }
  if (def.type === "nomadic/geometry/contour") {
    return NomadicGeometry.contourField(input, { levels: props.levels });
  }
  if (def.type === "nomadic/geometry/offset_contour") {
    return NomadicGeometry.offsetContour(input, {
      rings: props.rings,
      step: props.step,
      drift: props.drift
    }, state.seed);
  }
  if (def.type === "nomadic/convert/trace_to_shape") {
    return NomadicGeometry.traceToShape(input, { closeGap: props.close_gap });
  }
  if (def.type === "nomadic/convert/trace_to_points") {
    return NomadicGeometry.traceToPoints(input, {
      spacing: props.spacing,
      limit: props.limit
    });
  }
  if (def.type === "nomadic/convert/image_to_field") {
    return NomadicGeometry.imageToField(input, {
      channel: props.channel,
      invert: props.invert,
      contrast: props.contrast
    });
  }
  if (def.type === "nomadic/material/image_weathering") {
    return NomadicGeometry.imageWeathering(input, {
      mode: props.mode,
      tone: props.tone,
      inkColor: props.ink_color,
      paperColor: props.paper_color,
      toneAmount: props.tone_amount,
      exposure: props.exposure,
      contrast: props.contrast,
      grain: props.grain,
      dust: props.dust,
      paper: props.paper,
      fade: props.fade,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/material/graffiti_stroke") {
    return NomadicGeometry.graffitiStroke(input, {
      mode: props.mode,
      color: props.color,
      width: props.width,
      wobble: props.wobble,
      repeat: props.repeat,
      bleed: props.bleed,
      grain: props.grain,
      softness: props.softness,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/convert/shape_to_traces") {
    return NomadicGeometry.shapeToTraceSet(input, {
      mode: props.mode,
      density: props.density
    }, state.seed);
  }
  if (def.type === "nomadic/convert/field_mask") {
    return NomadicGeometry.fieldMask(input, {
      color: inputs[1],
      mode: props.mode,
      threshold: props.threshold,
      density: props.density
    }, state.seed);
  }
  if (def.type === "nomadic/convert/flatten_layers") {
    return NomadicGeometry.flattenLayers(input);
  }
  if (def.type === "nomadic/convert/layers_to_traces") {
    return NomadicGeometry.layersToTraceSet(input, { fieldLevels: props.field_levels });
  }
  if (def.type === "nomadic/convert/rasterize_layers") {
    return NomadicGeometry.rasterizeLayers(input, {
      detail: props.detail,
      sensitivity: props.sensitivity
    });
  }
  if (def.type === "nomadic/convert/cells_to_traces") {
    return NomadicGeometry.cellsToTraceSet(input);
  }
  if (def.type === "nomadic/field/invert") {
    return NomadicGeometry.invertField(input, { mix: props.mix });
  }
  if (def.type === "nomadic/selector/noise") {
    return NomadicGeometry.noiseSelector({
      threshold: props.threshold,
      scale: props.scale,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/selector/row_column") {
    return NomadicGeometry.rowColumnSelector({
      mode: props.mode,
      period: props.period,
      offset: props.offset
    }, state.seed);
  }
  if (def.type === "nomadic/selector/gradient") {
    return NomadicGeometry.gradientSelector({
      axis: props.axis,
      invert: props.invert,
      threshold: props.threshold,
      softness: props.softness
    }, state.seed);
  }
  if (def.type === "nomadic/boolean/shape") {
    return NomadicGeometry.shapeBoolean(inputs[0], inputs[1], {
      mode: props.mode,
      detail: props.detail
    });
  }
  if (def.type === "nomadic/boolean/field") {
    return NomadicGeometry.fieldBoolean(inputs[0], inputs[1], { mode: props.mode });
  }
  if (def.type === "nomadic/process/growth") {
    return NomadicGeometry.grow(input, {
      mode: props.mode,
      amount: props.amount,
      length: props.length,
      amountValue: inputs[1],
      lengthValue: inputs[2]
    }, state.seed);
  }
  if (def.type === "nomadic/process/noise_displace") {
    return NomadicGeometry.noiseDisplace(input, {
      noise: props.noise,
      strength: props.strength,
      scale: props.scale,
      strengthValue: inputs[1]
    }, state.seed);
  }
  if (def.type === "nomadic/process/sine_wave") {
    return NomadicGeometry.sineWave(input, {
      axis: props.axis,
      amplitude: props.amplitude,
      wavelength: props.wavelength,
      phase: props.phase
    });
  }
  if (def.type === "nomadic/process/smooth") {
    return NomadicGeometry.smoothTrace(input, {
      amount: props.amount,
      passes: props.passes
    });
  }
  if (def.type === "nomadic/process/curve_tension") {
    return NomadicGeometry.curveTension(input, { tension: props.tension, sag: props.sag });
  }
  if (def.type === "nomadic/process/wind") {
    return NomadicGeometry.wind(input, { force: props.force, angle: props.angle }, state.seed);
  }
  if (def.type === "nomadic/process/erode") {
    return NomadicGeometry.erode(input, { amount: props.amount }, state.seed);
  }
  if (def.type === "nomadic/process/dither") {
    return NomadicGeometry.dither(input, {
      mode: props.mode,
      threshold: props.threshold,
      scale: props.scale,
      mix: props.mix
    }, state.seed);
  }
  if (def.type === "nomadic/process/repeat") {
    return NomadicGeometry.repeatData(input, {
      count: props.count,
      stepX: props.step_x,
      stepY: props.step_y,
      scale: props.scale,
      fade: props.fade
    });
  }
  if (def.type === "nomadic/process/matrix_repeat") {
    return NomadicGeometry.matrixRepeatData(input, {
      columns: props.columns,
      rows: props.rows,
      stepX: props.step_x,
      stepY: props.step_y,
      scale: props.scale,
      jitter: props.jitter,
      fade: props.fade
    }, state.seed);
  }
  if (def.type === "nomadic/process/grid_slice") {
    return NomadicGeometry.gridSliceImage(input, {
      mode: props.mode,
      columns: props.columns,
      rows: props.rows,
      gap: props.gap,
      cropPadding: props.crop_padding,
      jitter: props.jitter,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/shuffle_tiles") {
    return NomadicGeometry.shuffleTiles(input, {
      mode: props.mode,
      amount: props.amount,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/mix_tiles") {
    return NomadicGeometry.mixTiles(inputs[0], inputs[1], {
      selector: inputs[2],
      mode: props.mode,
      layout: props.layout,
      fit: props.fit,
      amount: props.amount,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/stretch_tiles") {
    return NomadicGeometry.stretchTiles(input, {
      selector: inputs[1],
      axis: props.axis,
      anchor: props.anchor,
      pixelMode: props.pixel_mode,
      amount: props.amount,
      chance: props.chance,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/trace_slice") {
    return NomadicGeometry.traceSlice(input, {
      mode: props.mode,
      columns: props.columns,
      rows: props.rows,
      gap: props.gap,
      clipPadding: props.clip_padding,
      jitter: props.jitter,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/shuffle_cells") {
    return NomadicGeometry.shuffleCells(input, {
      mode: props.mode,
      amount: props.amount,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/process/stretch_cells") {
    return NomadicGeometry.stretchCells(input, {
      axis: props.axis,
      anchor: props.anchor,
      amount: props.amount,
      chance: props.chance,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/style/color") {
    return NomadicGeometry.createColor({
      palette: props.palette,
      seed: props.seed,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/style/fill_area") {
    return NomadicGeometry.fillArea(input, {
      color: inputs[1],
      mode: props.mode,
      density: props.density,
      threshold: props.threshold
    }, state.seed);
  }
  if (def.type === "nomadic/style/stroke_style") {
    return NomadicGeometry.strokeStyle(input, {
      color: inputs[1],
      widthValue: inputs[2],
      width: props.width,
      opacity: props.opacity
    });
  }
  if (def.type === "nomadic/style/ink_distress") {
    return NomadicGeometry.inkDistress(input, {
      mode: props.mode,
      threshold: props.threshold,
      blockSize: props.block_size,
      distress: props.distress,
      grain: props.grain,
      bleed: props.bleed,
      pressure: props.pressure,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/style/random_stroke_color") {
    return NomadicGeometry.randomStrokeColor(input, {
      target: props.target,
      palette: props.palette,
      variation: props.variation,
      seed: props.seed,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/style/random_size") {
    return NomadicGeometry.randomSize(input, {
      min: props.min,
      max: props.max,
      seed: props.seed
    }, state.seed);
  }
  if (def.type === "nomadic/style/point_labels") {
    return NomadicGeometry.pointLabels(inputs[0], inputs[1], {
      color: inputs[2],
      size: props.size,
      offset: props.offset,
      limit: props.limit,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/style/layer_labels") {
    return NomadicGeometry.layerLabels(inputs[0], inputs[1], {
      color: inputs[2],
      align: props.align,
      size: props.size,
      padding: props.padding,
      colorMode: props.color_mode,
      palette: props.palette,
      seed: props.seed,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/style/slice_labels") {
    loadTextFont(props.font);
    return NomadicGeometry.sliceLabels(inputs[0], inputs[1], {
      color: inputs[2],
      text: props.text,
      mapping: props.mapping,
      fit: props.fit,
      font: props.font,
      size: props.size,
      padding: props.padding,
      offsetX: props.offset_x,
      offsetY: props.offset_y,
      rotation: props.rotation,
      colorMode: props.color_mode,
      palette: props.palette,
      seed: props.seed,
      opacity: props.opacity
    }, state.seed);
  }
  if (def.type === "nomadic/output/layer_stack") {
    return NomadicGeometry.layerStack(inputs[0], inputs[1], {
      opacityA: props.opacity_a,
      opacityB: props.opacity_b,
      blendB: props.blend_b
    });
  }
  return null;
}

function bypassData(input, title) {
  const output = JSON.parse(JSON.stringify(input));
  output.bypassed = title;
  output.history = (output.history || []).concat([`${title} bypassed`]);
  output.stats = { ...(output.stats || {}), bypass: title };
  return output;
}

function drawNodeStatus(ctx, node, def) {
  if (def.preview || node.flags?.collapsed) return;
  const output = node.lastOutput;
  const isBypassed = node.properties.bypass === "On";
  const required = inputDefsFor(def).find((input) => !input.optional);
  const asyncStatus = def.type === "nomadic/source/gpt_image" ? node.properties.gpt_status : node.properties.ai_status;
  const text = isBypassed ? "bypassed" : asyncStatus || (output ? `${output.ngType} ready` : required ? `needs ${readableType(required.type)}` : "ready");
  ctx.save();
  ctx.fillStyle = isBypassed ? "rgba(141, 116, 85, 0.16)" : output ? "rgba(83, 107, 87, 0.12)" : "rgba(155, 96, 72, 0.11)";
  ctx.fillRect(12, node.size[1] - 34, node.size[0] - 24, 24);
  ctx.beginPath();
  ctx.rect(12, node.size[1] - 34, node.size[0] - 24, 24);
  ctx.clip();
  ctx.fillStyle = isBypassed ? "#75684d" : output ? "#536b57" : "#9b6048";
  ctx.font = `600 12px ${UI_FONT}`;
  ctx.fillText(truncateCanvasText(ctx, text, node.size[0] - 44), 22, node.size[1] - 17);
  ctx.restore();
}

function truncateCanvasText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 4 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function handleNodeButton(node, def, name) {
  if (def.type === "nomadic/source/audio_input" && name === "Load Audio") {
    readLocalFile("audio/*", "dataURL").then((dataUrl) => {
      if (!dataUrl) return;
      applyAudioDataUrl(node, dataUrl, "Audio Input").then(() => {
        runGraphOnce();
        scheduleUndoSnapshot();
      });
    });
  }
  if (def.type === "nomadic/audio/magenta_music" && name === "Generate") {
    generateMagentaMusic(node);
  }
  if (def.type === "nomadic/source/svg_input" && name === "Load SVG") {
    readLocalFile(".svg,image/svg+xml", "text").then((text) => {
      if (!text) return;
      const path = extractSvgPathText(text);
      node.properties.path = path;
      setWidgetValue(node, "Path", path);
      runGraphOnce();
      scheduleUndoSnapshot();
    });
  }
  if ((def.type === "nomadic/source/image_input" || def.type === "nomadic/source/image_field_input") && name === "Load Image") {
    readLocalFile("image/*", "dataURL").then((dataUrl) => {
      if (!dataUrl) return;
      node.properties.image_data_url = dataUrl;
      loadImageField(dataUrl).then((imageData) => {
        Object.assign(node.properties, imageData);
        runGraphOnce();
        scheduleUndoSnapshot();
      });
    });
  }
  if (def.type === "nomadic/source/gpt_image" && name === "Generate") {
    generateGptImage(node);
  }
  if (def.type === "nomadic/ai/gpt_image_edit" && name === "Edit") {
    generateGptImageEdit(node);
  }
  if (def.type === "nomadic/ai/vision_judge" && name === "Analyze") {
    generateVisionAnalysis(node);
  }
  if (def.type === "nomadic/ai/semantic_mask" && name === "Find Region") {
    generateSemanticMask(node);
  }
  if (def.type === "nomadic/ai/roboflow_sam2" && name === "Segment") {
    generateRoboflowSam2(node);
  }
  if (def.type === "nomadic/ai/mobile_sam" && name === "Segment") {
    generateMobileSam(node);
  }
}

function handleNodeWidgetChange(node, def, name) {
  if (def.type === "nomadic/source/text_shape" && name === "Font") {
    loadTextFont(node.properties.font).then(() => {
      runGraphOnce();
      graphCanvas?.setDirty(true, true);
    });
    return;
  }
  if (def.type === "nomadic/source/gpt_image" && ["API URL", "Prompt", "Model", "Size", "Quality", "Background"].includes(name)) {
    node.properties.gpt_status = "needs Generate";
    return;
  }
  if (def.type === "nomadic/ai/gpt_image_edit" && ["API URL", "Prompt", "Model", "Size", "Quality", "Background"].includes(name)) {
    node.properties.ai_status = "needs Edit";
    return;
  }
  if (def.type === "nomadic/ai/vision_judge" && ["API URL", "Vision Model", "Question", "Detail"].includes(name)) {
    node.properties.ai_status = "needs Analyze";
    return;
  }
  if (def.type === "nomadic/ai/semantic_mask" && ["API URL", "Vision Model", "Target", "Detail"].includes(name)) {
    node.properties.ai_status = "needs Find Region";
    return;
  }
  if (def.type === "nomadic/ai/roboflow_sam2" && ["API URL", "Model", "X", "Y", "Width", "Height"].includes(name)) {
    node.properties.ai_status = "needs Segment";
    return;
  }
  if (def.type === "nomadic/ai/mobile_sam" && ["Model", "X", "Y", "Width", "Height", "Mask Mode"].includes(name)) {
    node.properties.ai_status = "needs Segment";
    return;
  }
  if (def.type === "nomadic/audio/magenta_music" && ["Prompt", "Model", "Duration", "Backend"].includes(name)) {
    node.properties.ai_status = "needs Generate";
    return;
  }
  if ((def.type !== "nomadic/source/image_input" && def.type !== "nomadic/source/image_field_input" && def.type !== "nomadic/source/gpt_image") || name !== "Scale") return;
}

function loadTextFont(font) {
  if (!document.fonts?.load) return Promise.resolve();
  const family = `"${String(font || "Mononoki").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return document.fonts.load(`800 260px ${family}`).catch(() => undefined);
}

function readLocalFile(accept, mode) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      if (mode === "text") reader.readAsText(file);
      else reader.readAsDataURL(file);
    }, { once: true });
    input.click();
  });
}

function extractSvgPathText(text) {
  const match = String(text).match(/\sd=(["'])(.*?)\1/i);
  return match ? match[2] : String(text);
}

function loadImageField(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 112;
      const minSide = 24;
      const aspect = image.width / Math.max(1, image.height);
      const cols = aspect >= 1 ? maxSide : Math.max(minSide, Math.round(maxSide * aspect));
      const rows = aspect >= 1 ? Math.max(minSide, Math.round(maxSide / aspect)) : maxSide;
      const canvas = document.createElement("canvas");
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, cols, rows);
      ctx.drawImage(image, 0, 0, cols, rows);

      const rasterMaxSide = 420;
      const rasterCols = aspect >= 1 ? rasterMaxSide : Math.max(minSide, Math.round(rasterMaxSide * aspect));
      const rasterRows = aspect >= 1 ? Math.max(minSide, Math.round(rasterMaxSide / aspect)) : rasterMaxSide;
      const rasterCanvas = document.createElement("canvas");
      rasterCanvas.width = rasterCols;
      rasterCanvas.height = rasterRows;
      const rasterCtx = rasterCanvas.getContext("2d", { willReadFrequently: true });
      rasterCtx.clearRect(0, 0, rasterCols, rasterRows);
      rasterCtx.drawImage(image, 0, 0, rasterCols, rasterRows);

      resolve({
        image_pixels: Array.from(ctx.getImageData(0, 0, cols, rows).data),
        image_cols: cols,
        image_rows: rows,
        image_rect_x: 0,
        image_rect_y: 0,
        image_rect_width: cols,
        image_rect_height: rows,
        image_original_width: image.width,
        image_original_height: image.height,
        image_raster_pixels: Array.from(rasterCtx.getImageData(0, 0, rasterCols, rasterRows).data),
        image_raster_cols: rasterCols,
        image_raster_rows: rasterRows,
        image_sampling_version: 4,
        image_label: `Imported Image ${image.width}x${image.height}`
      });
    };
    image.onerror = () => resolve({});
    image.src = dataUrl;
  });
}

async function generateGptImage(node) {
  const prompt = String(node.properties.prompt || "").trim();
  if (!prompt) {
    node.properties.gpt_status = "prompt required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const key = await getOpenAIApiKey();
  if (!key) {
    node.properties.gpt_status = "API key required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  node.properties.gpt_status = "generating...";
  graphCanvas?.setDirty(true, true);

  try {
    const requestPayload = {
      prompt,
      model: normalizeImageModel(node.properties.model, node.properties.api_url),
      base_url: normalizeApiBaseUrl(node.properties.api_url),
      size: normalizeOpenAIOption(node.properties.size),
      quality: normalizeOpenAIOption(node.properties.quality),
      background: normalizeOpenAIOption(node.properties.background)
    };
    const cacheKey = node.properties.cache === "Off" ? null : await gptImageCacheKey(requestPayload);
    const cached = cacheKey ? await readGptImageCache(cacheKey) : null;
    if (cached?.image_base64) {
      await applyGptImagePayload(node, cached);
      node.properties.gpt_status = "cached image";
      runGraphOnce();
      scheduleUndoSnapshot();
      graphCanvas?.setDirty(true, true);
      return;
    }

    const response = await fetch(OPENAI_IMAGE_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(requestPayload)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
    if (!payload.image_base64) throw new Error("No image returned");

    await applyGptImagePayload(node, payload);
    if (cacheKey) writeGptImageCache(cacheKey, payload);
    node.properties.gpt_status = "generated";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.gpt_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

async function applyGptImagePayload(node, payload, label = "GPT Image") {
  const dataUrl = `data:image/png;base64,${payload.image_base64}`;
  node.properties.image_data_url = dataUrl;
  const imageData = await loadImageField(dataUrl);
  Object.assign(node.properties, imageData);
  node.properties.image_label = `${label} ${imageData.image_original_width || ""}x${imageData.image_original_height || ""}`.trim();
}

async function generateGptImageEdit(node) {
  runGraphOnce();
  const source = imageDataForSegmentation(node.getInputData(0));
  if (!source?.dataUrl) {
    node.properties.ai_status = "needs image";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const prompt = String(node.properties.prompt || "").trim();
  if (!prompt) {
    node.properties.ai_status = "prompt required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const key = await getOpenAIApiKey();
  if (!key) {
    node.properties.ai_status = "API key required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  node.properties.ai_status = "editing...";
  graphCanvas?.setDirty(true, true);

  try {
    const requestPayload = {
      prompt,
      model: normalizeImageModel(node.properties.model, node.properties.api_url),
      base_url: normalizeApiBaseUrl(node.properties.api_url),
      size: normalizeOpenAIOption(node.properties.size),
      quality: normalizeOpenAIOption(node.properties.quality),
      background: normalizeOpenAIOption(node.properties.background),
      image_data_url: source.dataUrl
    };
    const cacheKey = node.properties.cache === "Off" ? null : await gptImageCacheKey({
      mode: "edit",
      ...requestPayload
    });
    const cached = cacheKey ? await readGptImageCache(cacheKey) : null;
    if (cached?.image_base64) {
      await applyGptImagePayload(node, cached, "GPT Image Edit");
      node.properties.ai_status = "cached edit";
      runGraphOnce();
      scheduleUndoSnapshot();
      graphCanvas?.setDirty(true, true);
      return;
    }

    const response = await fetch(OPENAI_IMAGE_EDIT_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(requestPayload)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
    if (!payload.image_base64) throw new Error("No image returned");

    await applyGptImagePayload(node, payload, "GPT Image Edit");
    if (cacheKey) writeGptImageCache(cacheKey, payload);
    node.properties.ai_status = "edited";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

function audioFromProperties(props) {
  if (!props.audio_data_url) return null;
  const peaks = Array.isArray(props.audio_peaks) ? props.audio_peaks : [];
  const rms = Array.isArray(props.audio_rms) ? props.audio_rms : [];
  return {
    ngType: "Audio",
    dataUrl: props.audio_data_url,
    label: props.audio_label || "Audio",
    duration: Number(props.audio_duration || 0),
    sampleRate: Number(props.audio_sample_rate || 0),
    channels: Number(props.audio_channels || 0),
    peaks,
    rms,
    onsets: Array.isArray(props.audio_onsets) ? props.audio_onsets : audioOnsets(rms),
    history: [props.audio_label || "Audio"],
    stats: {
      duration: `${Number(props.audio_duration || 0).toFixed(2)}s`,
      samples: props.audio_sample_count || 0
    }
  };
}

async function applyAudioDataUrl(node, dataUrl, label) {
  node.properties.ai_status = "analyzing audio...";
  graphCanvas?.setDirty(true, true);
  const features = await analyzeAudioDataUrl(dataUrl);
  node.properties.audio_data_url = dataUrl;
  node.properties.audio_label = `${label} ${features.duration.toFixed(2)}s`;
  node.properties.audio_duration = features.duration;
  node.properties.audio_sample_rate = features.sampleRate;
  node.properties.audio_channels = features.channels;
  node.properties.audio_sample_count = features.sampleCount;
  node.properties.audio_peaks = features.peaks;
  node.properties.audio_rms = features.rms;
  node.properties.audio_onsets = features.onsets;
  node.properties.ai_status = "audio ready";
}

async function analyzeAudioDataUrl(dataUrl) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio is not available");
  const context = new AudioContextClass();
  try {
    const buffer = await (await fetch(dataUrl)).arrayBuffer();
    const audio = await context.decodeAudioData(buffer.slice(0));
    const channel = audio.getChannelData(0);
    const bins = 128;
    const peaks = [];
    const rms = [];
    for (let bin = 0; bin < bins; bin += 1) {
      const start = Math.floor((bin / bins) * channel.length);
      const end = Math.max(start + 1, Math.floor(((bin + 1) / bins) * channel.length));
      let peak = 0;
      let sum = 0;
      for (let index = start; index < end; index += 1) {
        const value = Math.abs(channel[index] || 0);
        peak = Math.max(peak, value);
        sum += value * value;
      }
      peaks.push(clampNumber(peak, 0, 1));
      rms.push(clampNumber(Math.sqrt(sum / Math.max(1, end - start)) * 1.8, 0, 1));
    }
    return {
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.numberOfChannels,
      sampleCount: audio.length,
      peaks,
      rms,
      onsets: audioOnsets(rms)
    };
  } finally {
    context.close?.();
  }
}

function audioOnsets(rms) {
  let previous = 0;
  return (rms || []).map((value) => {
    const onset = Math.max(0, Number(value || 0) - previous);
    previous = Number(value || 0) * 0.82 + previous * 0.18;
    return clampNumber(onset * 4, 0, 1);
  });
}

function audioFeatureField(audio, props = {}) {
  if (!audio || audio.ngType !== "Audio") return null;
  const cols = Math.round(Number(props.columns || 128));
  const rows = Math.round(Number(props.rows || 64));
  const contrast = Number(props.contrast || 70) / 70;
  const smoothing = Number(props.smoothing || 0) / 100;
  const source = audioFeatureSeries(audio, props.mode);
  if (!source.length) return null;
  const series = resampleSeries(source, cols);
  const values = [];
  for (let row = 0; row < rows; row += 1) {
    const y = rows <= 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < cols; col += 1) {
      const left = series[Math.max(0, col - 1)] || 0;
      const center = series[col] || 0;
      const right = series[Math.min(cols - 1, col + 1)] || 0;
      const smooth = center * (1 - smoothing) + ((left + center + right) / 3) * smoothing;
      const ridge = 1 - Math.abs(y - 0.5) * 2;
      values.push(clampNumber(Math.pow(smooth, 1 / Math.max(0.1, contrast)) * (0.22 + ridge * 0.78), 0, 1));
    }
  }
  return {
    ngType: "Field",
    label: `${audio.label || "Audio"} / ${props.mode || "Amplitude"} Field`,
    originX: 0,
    originY: 0,
    width: NomadicGeometry.WIDTH,
    height: NomadicGeometry.HEIGHT,
    cols,
    rows,
    values,
    history: (audio.history || ["Audio"]).concat([`Audio Field(${props.mode || "Amplitude"})`]),
    stats: {
      mode: props.mode || "Amplitude",
      duration: `${Number(audio.duration || 0).toFixed(2)}s`
    }
  };
}

function audioFeatureSeries(audio, mode) {
  if (mode === "Waveform") return audio.peaks || [];
  if (mode === "Onsets") return audio.onsets || [];
  return audio.rms || audio.peaks || [];
}

function resampleSeries(series, count) {
  if (!series.length || count <= 0) return [];
  if (series.length === count) return series.slice();
  const output = [];
  for (let index = 0; index < count; index += 1) {
    const t = count <= 1 ? 0 : (index / (count - 1)) * (series.length - 1);
    const left = Math.floor(t);
    const right = Math.min(series.length - 1, left + 1);
    const mix = t - left;
    output.push((series[left] || 0) * (1 - mix) + (series[right] || 0) * mix);
  }
  return output;
}

async function generateMagentaMusic(node) {
  const prompt = String(node.properties.prompt || "").trim();
  if (!prompt) {
    node.properties.ai_status = "prompt required";
    graphCanvas?.setDirty(true, true);
    return;
  }
  node.properties.ai_status = "generating audio...";
  graphCanvas?.setDirty(true, true);
  try {
    const requestPayload = {
      prompt,
      model: String(node.properties.model || "mrt2_small").trim(),
      duration: Number(node.properties.duration || 4),
      backend: String(node.properties.backend || "mlx").trim()
    };
    const cacheKey = node.properties.cache === "Off" ? null : await gptImageCacheKey({ mode: "magenta_audio", ...requestPayload });
    const cached = cacheKey ? await readGptImageCache(cacheKey) : null;
    if (cached?.audio_data_url) {
      await applyAudioDataUrl(node, cached.audio_data_url, "Magenta Music");
      node.properties.ai_status = "cached audio";
      runGraphOnce();
      scheduleUndoSnapshot();
      return;
    }
    const response = await fetch(MAGENTA_AUDIO_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
    if (!payload.audio_data_url) throw new Error("No audio returned");
    await applyAudioDataUrl(node, payload.audio_data_url, "Magenta Music");
    if (cacheKey) writeGptImageCache(cacheKey, { audio_data_url: payload.audio_data_url });
    node.properties.ai_status = "generated";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

function normalizeOpenAIOption(value) {
  const text = String(value || "auto").trim().toLowerCase();
  return text || "auto";
}

function normalizeImageModel(model, apiUrl) {
  const text = String(model || "").trim();
  const baseUrl = normalizeApiBaseUrl(apiUrl);
  if (/yq66\.ai/i.test(baseUrl) && (!text || text === "Image2" || text === "image-2")) return "gpt-image-2-pro";
  return text || "gpt-image-2-pro";
}

function normalizeApiBaseUrl(value) {
  const text = String(value || "https://yq66.ai").trim();
  return text || "https://yq66.ai";
}

function getOpenAIApiKey() {
  if (state.openaiApiKey) return Promise.resolve(state.openaiApiKey);
  const stored = readStoredValue(API_KEY_STORAGE_KEY);
  if (stored) {
    state.openaiApiKey = stored;
    return Promise.resolve(stored);
  }
  const key = window.prompt("API key for this device. It will be saved in localStorage and is not saved into the patch.");
  state.openaiApiKey = String(key || "").trim() || null;
  if (state.openaiApiKey) writeStoredValue(API_KEY_STORAGE_KEY, state.openaiApiKey);
  return Promise.resolve(state.openaiApiKey);
}

function getRoboflowApiKey() {
  if (state.roboflowApiKey) return Promise.resolve(state.roboflowApiKey);
  const stored = readStoredValue(ROBOFLOW_API_KEY_STORAGE_KEY);
  if (stored) {
    state.roboflowApiKey = stored;
    return Promise.resolve(stored);
  }
  const key = window.prompt("Roboflow API key for this device. It will be saved in localStorage and is not saved into the patch.");
  state.roboflowApiKey = String(key || "").trim() || null;
  if (state.roboflowApiKey) writeStoredValue(ROBOFLOW_API_KEY_STORAGE_KEY, state.roboflowApiKey);
  return Promise.resolve(state.roboflowApiKey);
}

async function generateVisionAnalysis(node) {
  runGraphOnce();
  const image = node.getInputData(0);
  const dataUrl = imageDataUrlForVision(image);
  if (!dataUrl) {
    node.properties.ai_status = "needs image";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const key = await getOpenAIApiKey();
  if (!key) {
    node.properties.ai_status = "API key required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  node.properties.ai_status = "analyzing...";
  graphCanvas?.setDirty(true, true);

  const question = String(node.properties.question || "").trim() || "Describe this image for graphic design.";
  const prompt = [
    "Return only valid JSON. Do not wrap it in markdown.",
    "Analyze the image for a node-based graphic design tool.",
    "Use this schema:",
    "{\"summary\":\"...\",\"subjects\":[\"...\"],\"regions\":[{\"label\":\"...\",\"confidence\":0.8,\"bbox\":[0,0,1,1],\"polygon\":[[0,0],[1,0],[1,1],[0,1]]}],\"patch_ideas\":[\"...\"],\"prompt_rewrites\":[\"...\"]}",
    "All bbox and polygon coordinates must be normalized from 0 to 1 relative to the image.",
    question
  ].join("\n");

  try {
    const payload = await requestVisionJson({
      key,
      apiUrl: node.properties.api_url,
      model: node.properties.vision_model,
      prompt,
      imageDataUrl: dataUrl,
      detail: node.properties.detail
    });
    node.properties.ai_analysis_json = JSON.stringify(payload);
    node.properties.ai_status = "analyzed";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

async function generateSemanticMask(node) {
  runGraphOnce();
  const image = node.getInputData(0);
  const dataUrl = imageDataUrlForVision(image);
  if (!dataUrl) {
    node.properties.ai_status = "needs image";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const key = await getOpenAIApiKey();
  if (!key) {
    node.properties.ai_status = "API key required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const target = String(node.properties.target || "main subject").trim() || "main subject";
  node.properties.ai_status = "finding region...";
  graphCanvas?.setDirty(true, true);

  const prompt = [
    "Return only valid JSON. Do not wrap it in markdown.",
    `Find the image region matching this target: ${target}`,
    "Be precise and conservative. Return only the visible pixels of the requested object or body part.",
    "If the target is clothing such as shirt, jacket, coat, upper clothing, or 上衣, include only the visible torso/upper-garment fabric. Exclude head, hands, pants, shoes, backpack, sky, ground, shadows, and background.",
    "If the target is the person's main body/主体部分, include the visible person silhouette only. Exclude sky, ground, mountains, water, motion trails, and background gaps around limbs.",
    "Prefer one or more tight polygons with 8 to 24 points. Use bbox only as a fallback if polygon is impossible.",
    "Do not return the whole person unless the target explicitly asks for the whole person.",
    "Return normalized coordinates relative to the whole image.",
    "Use this exact schema:",
    "{\"target\":\"...\",\"summary\":\"...\",\"regions\":[{\"label\":\"...\",\"confidence\":0.8,\"bbox\":[x,y,width,height],\"polygon\":[[x,y],[x,y],[x,y],[x,y]]}]}",
    "If the target is not visible, return {\"target\":\"...\",\"summary\":\"not found\",\"regions\":[]}."
  ].join("\n");

  try {
    const payload = await requestVisionJson({
      key,
      apiUrl: node.properties.api_url,
      model: node.properties.vision_model,
      prompt,
      imageDataUrl: dataUrl,
      detail: node.properties.detail
    });
    node.properties.ai_analysis_json = JSON.stringify(payload);
    const count = Array.isArray(payload.regions) ? payload.regions.length : 0;
    node.properties.ai_status = count ? `found ${count} region${count > 1 ? "s" : ""}` : "not found";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

async function generateRoboflowSam2(node) {
  runGraphOnce();
  const image = node.getInputData(0);
  const boxField = node.getInputData(1);
  const source = imageDataForSegmentation(image);
  if (!source?.dataUrl) {
    node.properties.ai_status = "needs image";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const key = await getRoboflowApiKey();
  if (!key) {
    node.properties.ai_status = "API key required";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const box = roboflowBoxForRequest(boxField, node.properties, source.width, source.height);
  if (!box) {
    node.properties.ai_status = "needs box";
    graphCanvas?.setDirty(true, true);
    return;
  }

  node.properties.ai_status = "segmenting...";
  graphCanvas?.setDirty(true, true);

  try {
    const response = await fetch(ROBOFLOW_SAM2_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        api_url: String(node.properties.api_url || "").trim(),
        model: String(node.properties.model || "hiera_small").trim(),
        image_data_url: source.dataUrl,
        image_width: source.width,
        image_height: source.height,
        box
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
    const prediction = bestSam2Prediction(payload);
    const regions = sam2RegionsFromPrediction(prediction, source.width, source.height);
    node.properties.rf_sam2_json = JSON.stringify({
      model: String(node.properties.model || "hiera_small").trim(),
      image_width: source.width,
      image_height: source.height,
      box,
      predictions: Array.isArray(payload.predictions) ? payload.predictions : [],
      regions
    });
    node.properties.ai_status = regions.length ? `segmented ${regions.length}` : "empty mask";
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

async function generateMobileSam(node) {
  runGraphOnce();
  const image = node.getInputData(0);
  const boxField = node.getInputData(1);
  const source = imageDataForSegmentation(image);
  if (!source?.dataUrl) {
    node.properties.ai_status = "needs image";
    graphCanvas?.setDirty(true, true);
    return;
  }

  const normalizedBox = normalizedBoxFromField(boxField) || normalizedBoxFromProps(node.properties);
  if (!normalizedBox) {
    node.properties.ai_status = "needs box";
    graphCanvas?.setDirty(true, true);
    return;
  }

  node.properties.ai_status = "loading MobileSAM...";
  graphCanvas?.setDirty(true, true);

  try {
    const result = await runMobileSamBox(image, source, normalizedBox, node.properties.mask_mode, (status) => {
      node.properties.ai_status = status;
      graphCanvas?.setDirty(true, true);
    });
    node.properties.mobile_sam_field_values = Array.from(result.values);
    node.properties.mobile_sam_field_cols = result.cols;
    node.properties.mobile_sam_field_rows = result.rows;
    node.properties.mobile_sam_source_width = source.width;
    node.properties.mobile_sam_source_height = source.height;
    node.properties.mobile_sam_box = [
      Number(normalizedBox.x || 0),
      Number(normalizedBox.y || 0),
      Number(normalizedBox.width || 0),
      Number(normalizedBox.height || 0)
    ];
    node.properties.ai_status = `local mask ${result.cols}x${result.rows}`;
    runGraphOnce();
    scheduleUndoSnapshot();
  } catch (error) {
    console.error(error);
    node.properties.ai_status = `error: ${String(error.message || error).slice(0, 48)}`;
    graphCanvas?.setDirty(true, true);
  }
}

async function ensureMobileSamRuntime() {
  if (state.mobileSamRuntime) return state.mobileSamRuntime;
  if (!window.ort) {
    await loadScriptOnce(MOBILE_SAM_ORT_URL);
  }
  if (!window.ort) throw new Error("ONNX runtime did not load");
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = MOBILE_SAM_WASM_PATH;
  const sessionOptions = { executionProviders: ["wasm"] };
  const [encoder, decoder] = await Promise.all([
    ort.InferenceSession.create(MOBILE_SAM_ENCODER_URL, sessionOptions),
    ort.InferenceSession.create(MOBILE_SAM_DECODER_URL, sessionOptions)
  ]);
  state.mobileSamRuntime = { encoder, decoder };
  return state.mobileSamRuntime;
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.ort) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      window.setTimeout(() => {
        if (window.ort) resolve();
        else reject(new Error(`Could not initialize ${src}`));
      }, 2400);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

async function runMobileSamBox(image, source, normalizedBox, maskMode, setStatus) {
  const runtime = await ensureMobileSamRuntime();
  setStatus?.("preparing image...");
  const loadedImage = await loadImageElement(source.dataUrl);
  const target = mobileSamTargetSize(loadedImage.width, loadedImage.height);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(loadedImage, 0, 0, target.width, target.height);
  const imageData = ctx.getImageData(0, 0, target.width, target.height);
  const encoderInput = mobileSamImageTensor(imageData);

  setStatus?.("encoding image...");
  const encoded = await runtime.encoder.run({ input_image: encoderInput });
  const imageEmbeddings = encoded.image_embeddings || encoded[Object.keys(encoded)[0]];
  if (!imageEmbeddings) throw new Error("MobileSAM encoder returned no embeddings");

  const box = clampNormalizedBox(normalizedBox);
  const pointCoords = new ort.Tensor(new Float32Array([
    box.x * target.width,
    box.y * target.height,
    (box.x + box.width) * target.width,
    (box.y + box.height) * target.height
  ]), [1, 2, 2]);
  const pointLabels = new ort.Tensor(new Float32Array([2, 3]), [1, 2]);
  const maskInput = new ort.Tensor(new Float32Array(256 * 256), [1, 1, 256, 256]);
  const hasMask = new ort.Tensor(new Float32Array([0]), [1]);
  const originalImageSize = new ort.Tensor(new Float32Array([target.height, target.width]), [2]);

  setStatus?.("decoding mask...");
  const decoded = await runtime.decoder.run({
    image_embeddings: imageEmbeddings,
    point_coords: pointCoords,
    point_labels: pointLabels,
    mask_input: maskInput,
    has_mask_input: hasMask,
    orig_im_size: originalImageSize
  });
  const mask = decoded.masks || decoded[Object.keys(decoded).find((key) => /mask/i.test(key))] || decoded[Object.keys(decoded)[0]];
  const iou = decoded.iou_predictions || decoded[Object.keys(decoded).find((key) => /iou/i.test(key))] || null;
  if (!mask) throw new Error("MobileSAM decoder returned no mask");
  return mobileSamMaskResultToField(image, mask, iou, maskMode);
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for MobileSAM"));
    img.src = dataUrl;
  });
}

function mobileSamTargetSize(width, height) {
  const maxSide = 1024;
  const scale = maxSide / Math.max(1, Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function mobileSamImageTensor(imageData) {
  const { data, width, height } = imageData;
  const input = new Float32Array(width * height * 3);
  for (let index = 0, pixel = 0; pixel < width * height; pixel += 1, index += 4) {
    const offset = pixel * 3;
    input[offset] = data[index];
    input[offset + 1] = data[index + 1];
    input[offset + 2] = data[index + 2];
  }
  return new ort.Tensor(input, [height, width, 3]);
}

function clampNormalizedBox(box) {
  const x = clampNumber(Number(box.x || 0), 0, 0.99);
  const y = clampNumber(Number(box.y || 0), 0, 0.99);
  const width = clampNumber(Number(box.width || 0.01), 0.01, 1 - x);
  const height = clampNumber(Number(box.height || 0.01), 0.01, 1 - y);
  return { x, y, width, height };
}

function mobileSamMaskResultToField(image, mask, iou, maskMode) {
  const dims = mask.dims || [];
  const { width: maskWidth, height: maskHeight, channelOffsets } = mobileSamMaskLayout(dims, iou, maskMode, mask.data || []);
  const sourceAspect = Number(image.originalWidth || image.cols || 1) / Math.max(1, Number(image.originalHeight || image.rows || 1));
  const cols = sourceAspect >= 1 ? 128 : Math.max(32, Math.round(128 * sourceAspect));
  const rows = sourceAspect >= 1 ? Math.max(32, Math.round(128 / sourceAspect)) : 128;
  const normalizedMask = combineMobileSamMasks(mask.data || [], channelOffsets, maskWidth * maskHeight);
  const values = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    const sy = Math.round((row / Math.max(1, rows - 1)) * (maskHeight - 1));
    for (let col = 0; col < cols; col += 1) {
      const sx = Math.round((col / Math.max(1, cols - 1)) * (maskWidth - 1));
      values[row * cols + col] = normalizedMask[sy * maskWidth + sx] || 0;
    }
  }
  return { values, cols, rows };
}

function mobileSamMaskLayout(dims, iou, maskMode, data) {
  if (dims.length === 4) {
    const channels = Math.max(1, Number(dims[1] || 1));
    const height = Number(dims[2] || 1);
    const width = Number(dims[3] || 1);
    const channelSize = width * height;
    const mode = String(maskMode || "Largest");
    if (mode === "Union") {
      return { width, height, channelOffsets: Array.from({ length: channels }, (_, index) => index * channelSize) };
    }
    const channel = mode === "Best"
      ? bestMobileSamChannel(iou, channels)
      : largestMobileSamChannel(data, channels, channelSize);
    return { width, height, channelOffsets: [channel * channelSize] };
  }
  if (dims.length === 3) {
    return { width: Number(dims[2] || 1), height: Number(dims[1] || 1), channelOffsets: [0] };
  }
  if (dims.length === 2) {
    return { width: Number(dims[1] || 1), height: Number(dims[0] || 1), channelOffsets: [0] };
  }
  return { width: 256, height: 256, channelOffsets: [0] };
}

function bestMobileSamChannel(iou, channels) {
  const data = iou?.data || [];
  let best = 0;
  let bestScore = -Infinity;
  for (let index = 0; index < Math.min(channels, data.length || channels); index += 1) {
    const score = Number(data[index] ?? 0);
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  }
  return best;
}

function largestMobileSamChannel(data, channels, channelSize) {
  let best = 0;
  let bestArea = -1;
  for (let channel = 0; channel < channels; channel += 1) {
    const offset = channel * channelSize;
    let area = 0;
    for (let index = 0; index < channelSize; index += 1) {
      if (Number(data[offset + index] || 0) > 0) area += 1;
    }
    if (area > bestArea) {
      best = channel;
      bestArea = area;
    }
  }
  return best;
}

function combineMobileSamMasks(data, offsets, length) {
  const output = new Float32Array(length);
  const safeOffsets = Array.isArray(offsets) && offsets.length ? offsets : [0];
  for (const offset of safeOffsets) {
    const normalized = normalizeMobileSamMask(data, offset, length);
    for (let index = 0; index < length; index += 1) {
      output[index] = Math.max(output[index], normalized[index] || 0);
    }
  }
  return output;
}

function normalizeMobileSamMask(data, offset, length) {
  const output = new Float32Array(length);
  let min = Infinity;
  let max = -Infinity;
  for (let index = 0; index < length; index += 1) {
    const value = Number(data[offset + index] || 0);
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  for (let index = 0; index < length; index += 1) {
    const raw = Number(data[offset + index] || 0);
    let value = raw;
    if (min < 0 || max > 2) value = 1 / (1 + Math.exp(-raw));
    else if (max > 1) value = raw / Math.max(1, max);
    output[index] = clampNumber(value, 0, 1);
  }
  return output;
}

async function requestVisionJson({ key, apiUrl, model, prompt, imageDataUrl, detail }) {
  const response = await fetch(OPENAI_CHAT_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      base_url: normalizeApiBaseUrl(apiUrl),
      model: String(model || "gpt-4o-mini").trim() || "gpt-4o-mini",
      prompt,
      image_data_url: imageDataUrl,
      detail: String(detail || "Low").toLowerCase()
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}`);
  return parseJsonPayload(payload.content || payload.text || payload);
}

function parseJsonPayload(value) {
  if (value && typeof value === "object") return value;
  const text = String(value || "").trim();
  if (!text) throw new Error("Empty vision response");
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Vision response was not JSON");
    return JSON.parse(match[0]);
  }
}

function imageDataUrlForVision(image) {
  if (!image || image.ngType !== "Image") return "";
  const cols = Number(image.cols || 0);
  const rows = Number(image.rows || 0);
  const pixels = image.pixels || [];
  if (!cols || !rows || pixels.length < cols * rows * 4) {
    return image.dataUrl && image.dataUrl.length < 1_800_000 ? image.dataUrl : "";
  }
  const maxSide = 768;
  const scale = Math.min(1, maxSide / Math.max(cols, rows));
  const targetCols = Math.max(1, Math.round(cols * scale));
  const targetRows = Math.max(1, Math.round(rows * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  const data = new ImageData(new Uint8ClampedArray(pixels), cols, rows);
  ctx.putImageData(data, 0, 0);
  if (targetCols === cols && targetRows === rows) return canvas.toDataURL("image/jpeg", 0.82);
  const scaled = document.createElement("canvas");
  scaled.width = targetCols;
  scaled.height = targetRows;
  const scaledCtx = scaled.getContext("2d");
  scaledCtx.drawImage(canvas, 0, 0, targetCols, targetRows);
  return scaled.toDataURL("image/jpeg", 0.82);
}

function imageDataForSegmentation(image) {
  if (!image || image.ngType !== "Image") return null;
  const originalWidth = Math.max(1, Math.round(Number(image.originalWidth || image.cols || 1)));
  const originalHeight = Math.max(1, Math.round(Number(image.originalHeight || image.rows || 1)));
  if (image.dataUrl) {
    return {
      dataUrl: image.dataUrl,
      width: originalWidth,
      height: originalHeight
    };
  }
  const cols = Number(image.cols || 0);
  const rows = Number(image.rows || 0);
  const pixels = image.pixels || [];
  if (!cols || !rows || pixels.length < cols * rows * 4) return null;
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), cols, rows), 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: cols,
    height: rows
  };
}

function roboflowBoxForRequest(boxField, props, imageWidth, imageHeight) {
  const normalized = normalizedBoxFromField(boxField) || normalizedBoxFromProps(props);
  if (!normalized) return null;
  const left = clampNumber(normalized.x, 0, 0.99);
  const top = clampNumber(normalized.y, 0, 0.99);
  const width = clampNumber(normalized.width, 0.01, 1 - left);
  const height = clampNumber(normalized.height, 0.01, 1 - top);
  return {
    x: Math.round((left + width / 2) * imageWidth),
    y: Math.round((top + height / 2) * imageHeight),
    width: Math.max(2, Math.round(width * imageWidth)),
    height: Math.max(2, Math.round(height * imageHeight))
  };
}

function normalizedBoxFromProps(props = {}) {
  return {
    x: Number(props.x || 0) / 100,
    y: Number(props.y || 0) / 100,
    width: Number(props.width || 1) / 100,
    height: Number(props.height || 1) / 100
  };
}

function normalizedBoxFromField(field) {
  if (!field || field.ngType !== "Field" || !Array.isArray(field.values)) return null;
  const cols = Number(field.cols || 0);
  const rows = Number(field.rows || 0);
  if (!cols || !rows) return null;
  let minCol = cols;
  let minRow = rows;
  let maxCol = -1;
  let maxRow = -1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = Number(field.values[row * cols + col] || 0);
      if (value <= 0.2) continue;
      minCol = Math.min(minCol, col);
      minRow = Math.min(minRow, row);
      maxCol = Math.max(maxCol, col);
      maxRow = Math.max(maxRow, row);
    }
  }
  if (maxCol < minCol || maxRow < minRow) return null;
  return {
    x: minCol / Math.max(1, cols - 1),
    y: minRow / Math.max(1, rows - 1),
    width: (maxCol - minCol + 1) / Math.max(1, cols),
    height: (maxRow - minRow + 1) / Math.max(1, rows)
  };
}

function bestSam2Prediction(payload) {
  const predictions = Array.isArray(payload?.predictions) ? payload.predictions : [];
  if (!predictions.length) return null;
  return predictions.reduce((best, item) => {
    const score = Number(item?.confidence ?? item?.score ?? 0);
    const bestScore = Number(best?.confidence ?? best?.score ?? -Infinity);
    return score > bestScore ? item : best;
  }, predictions[0]);
}

function sam2RegionsFromPrediction(prediction, imageWidth, imageHeight) {
  if (!prediction) return [];
  const rawMasks = Array.isArray(prediction.masks) ? prediction.masks : [];
  const regions = [];
  for (const mask of rawMasks) {
    const polygon = normalizeSam2MaskPolygon(mask, imageWidth, imageHeight);
    if (polygon.length < 3) continue;
    regions.push({
      label: "SAM2 mask",
      confidence: Number(prediction.confidence ?? prediction.score ?? 1),
      polygon
    });
  }
  return regions;
}

function normalizeSam2MaskPolygon(mask, imageWidth, imageHeight) {
  const points = Array.isArray(mask?.points) ? mask.points : Array.isArray(mask?.polygon) ? mask.polygon : mask;
  if (!Array.isArray(points)) return [];
  return points
    .map((point) => {
      if (Array.isArray(point)) return [Number(point[0]), Number(point[1])];
      return [Number(point?.x), Number(point?.y)];
    })
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y]) => [
      clampNumber(x / Math.max(1, imageWidth), 0, 1),
      clampNumber(y / Math.max(1, imageHeight), 0, 1)
    ]);
}

function analysisFromProperties(props, label) {
  if (!props.ai_analysis_json) return null;
  try {
    const data = JSON.parse(props.ai_analysis_json);
    const regions = Array.isArray(data.regions) ? data.regions : [];
    const summary = String(data.summary || data.target || label || "Analysis");
    return {
      ngType: "Analysis",
      label,
      data,
      regions,
      summary,
      history: [label],
      stats: {
        summary: summary.slice(0, 52),
        regions: regions.length,
        target: String(data.target || props.target || "").slice(0, 34)
      }
    };
  } catch {
    return null;
  }
}

function semanticMaskField(image, analysis, options = {}) {
  if (!image || image.ngType !== "Image" || !analysis) return null;
  const regions = Array.isArray(analysis.regions) ? analysis.regions : [];
  if (!regions.length) return null;

  const sourceAspect = Number(image.originalWidth || image.cols || 1) / Math.max(1, Number(image.originalHeight || image.rows || 1));
  const cols = sourceAspect >= 1 ? 128 : Math.max(32, Math.round(128 * sourceAspect));
  const rows = sourceAspect >= 1 ? Math.max(32, Math.round(128 / sourceAspect)) : 128;
  const feather = Math.max(0, Number(options.feather || 0)) / 100;
  const strength = Math.max(0, Math.min(1, Number(options.strength ?? 100) / 100));
  const values = [];

  for (let row = 0; row < rows; row += 1) {
    const y = rows <= 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < cols; col += 1) {
      const x = cols <= 1 ? 0 : col / (cols - 1);
      let value = 0;
      for (const region of regions) {
        value = Math.max(value, regionMaskValue(region, x, y, feather));
      }
      values.push(Math.max(0, Math.min(1, value * strength)));
    }
  }

  const target = String(analysis.data?.target || options.target || "semantic region");
  return {
    ngType: "Field",
    label: `Semantic Mask: ${target}`,
    sourceShape: null,
    cols,
    rows,
    originX: Number(image.originX || 0),
    originY: Number(image.originY || 0),
    width: Number(image.width || NomadicGeometry.WIDTH),
    height: Number(image.height || NomadicGeometry.HEIGHT),
    values,
    history: (image.history || ["Image"]).concat([`Semantic Mask(${target})`]),
    stats: {
      target: target.slice(0, 36),
      regions: regions.length,
      feather: Math.round(Number(options.feather || 0)),
      strength: Math.round(strength * 100)
    }
  };
}

function roboflowSam2Field(image, props, options = {}) {
  if (!image || image.ngType !== "Image" || !props?.rf_sam2_json) return null;
  let data = null;
  try {
    data = JSON.parse(props.rf_sam2_json);
  } catch {
    return null;
  }
  const regions = Array.isArray(data.regions) && data.regions.length
    ? data.regions
    : sam2RegionsFromPrediction(bestSam2Prediction(data), Number(data.image_width || image.originalWidth || image.cols || 1), Number(data.image_height || image.originalHeight || image.rows || 1));
  if (!regions.length) return null;

  const sourceAspect = Number(image.originalWidth || image.cols || 1) / Math.max(1, Number(image.originalHeight || image.rows || 1));
  const cols = sourceAspect >= 1 ? 128 : Math.max(32, Math.round(128 * sourceAspect));
  const rows = sourceAspect >= 1 ? Math.max(32, Math.round(128 / sourceAspect)) : 128;
  const feather = Math.max(0, Number(options.feather || 0)) / 100;
  const strength = Math.max(0, Math.min(1, Number(options.strength ?? 100) / 100));
  const values = [];

  for (let row = 0; row < rows; row += 1) {
    const y = rows <= 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < cols; col += 1) {
      const x = cols <= 1 ? 0 : col / (cols - 1);
      let value = 0;
      for (const region of regions) {
        value = Math.max(value, regionMaskValue(region, x, y, feather));
      }
      values.push(Math.max(0, Math.min(1, value * strength)));
    }
  }

  return {
    ngType: "Field",
    label: "Roboflow SAM2 Mask",
    sourceShape: null,
    cols,
    rows,
    originX: Number(image.originX || 0),
    originY: Number(image.originY || 0),
    width: Number(image.width || NomadicGeometry.WIDTH),
    height: Number(image.height || NomadicGeometry.HEIGHT),
    values,
    history: (image.history || ["Image"]).concat(["Roboflow SAM2"]),
    stats: {
      model: String(data.model || props.model || "SAM2").slice(0, 28),
      regions: regions.length,
      feather: Math.round(Number(options.feather || 0)),
      strength: Math.round(strength * 100)
    }
  };
}

function mobileSamFieldFromProperties(image, props, options = {}) {
  if (!image || image.ngType !== "Image" || !Array.isArray(props.mobile_sam_field_values)) return null;
  const cols = Number(props.mobile_sam_field_cols || 0);
  const rows = Number(props.mobile_sam_field_rows || 0);
  if (!cols || !rows || props.mobile_sam_field_values.length < cols * rows) return null;
  const threshold = clampNumber(Number(props.threshold ?? 50) / 100, 0, 1);
  const strength = Math.max(0, Math.min(1, Number(options.strength ?? 100) / 100));
  const featherRadius = Math.round(Math.max(0, Number(options.feather || 0)) / 5);
  let values = props.mobile_sam_field_values.slice(0, cols * rows).map((raw) => {
    const value = clampNumber(Number(raw || 0), 0, 1);
    if (threshold <= 0) return value;
    if (value <= threshold) return 0;
    return clampNumber((value - threshold) / Math.max(0.001, 1 - threshold), 0, 1);
  });
  if (featherRadius > 0) values = blurFieldValues(values, cols, rows, featherRadius);
  values = values.map((value) => clampNumber(value * strength, 0, 1));
  return {
    ngType: "Field",
    label: "Mobile SAM Mask",
    sourceShape: null,
    cols,
    rows,
    originX: Number(image.originX || 0),
    originY: Number(image.originY || 0),
    width: Number(image.width || NomadicGeometry.WIDTH),
    height: Number(image.height || NomadicGeometry.HEIGHT),
    values,
    history: (image.history || ["Image"]).concat(["Mobile SAM"]),
    stats: {
      model: "MobileSAM local",
      threshold: Math.round(threshold * 100),
      feather: Math.round(Number(options.feather || 0)),
      strength: Math.round(strength * 100)
    }
  };
}

function blurFieldValues(values, cols, rows, radius) {
  if (radius <= 0) return values;
  const output = new Array(values.length).fill(0);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const y = row + dy;
        if (y < 0 || y >= rows) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const x = col + dx;
          if (x < 0 || x >= cols) continue;
          sum += values[y * cols + x] || 0;
          count += 1;
        }
      }
      output[row * cols + col] = count ? sum / count : values[row * cols + col] || 0;
    }
  }
  return output;
}

function boxMaskField(image, options = {}) {
  if (!image || image.ngType !== "Image") return null;
  const sourceAspect = Number(image.originalWidth || image.cols || 1) / Math.max(1, Number(image.originalHeight || image.rows || 1));
  const cols = sourceAspect >= 1 ? 128 : Math.max(32, Math.round(128 * sourceAspect));
  const rows = sourceAspect >= 1 ? Math.max(32, Math.round(128 / sourceAspect)) : 128;
  const region = {
    bbox: [
      Number(options.x || 0) / 100,
      Number(options.y || 0) / 100,
      Number(options.width || 1) / 100,
      Number(options.height || 1) / 100
    ]
  };
  const feather = Math.max(0, Number(options.feather || 0)) / 100;
  const strength = Math.max(0, Math.min(1, Number(options.strength ?? 100) / 100));
  const values = [];
  for (let row = 0; row < rows; row += 1) {
    const y = rows <= 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < cols; col += 1) {
      const x = cols <= 1 ? 0 : col / (cols - 1);
      values.push(regionMaskValue(region, x, y, feather) * strength);
    }
  }
  return {
    ngType: "Field",
    label: "Box Mask",
    sourceShape: null,
    cols,
    rows,
    originX: Number(image.originX || 0),
    originY: Number(image.originY || 0),
    width: Number(image.width || NomadicGeometry.WIDTH),
    height: Number(image.height || NomadicGeometry.HEIGHT),
    values,
    history: (image.history || ["Image"]).concat(["Box Mask"]),
    stats: {
      x: Math.round(Number(options.x || 0)),
      y: Math.round(Number(options.y || 0)),
      width: Math.round(Number(options.width || 1)),
      height: Math.round(Number(options.height || 1)),
      feather: Math.round(Number(options.feather || 0))
    }
  };
}

function regionMaskValue(region, x, y, feather) {
  const polygon = normalizePolygon(region.polygon);
  if (polygon.length >= 3) {
    const inside = pointInPolygon(x, y, polygon);
    if (inside) return 1;
    if (feather) {
      const distance = distanceToPolygon(x, y, polygon);
      if (distance <= feather) return 1 - distance / feather;
    }
    return 0;
  }
  const bbox = normalizeBbox(region.bbox);
  if (!bbox) return polygon.length >= 3 ? 0 : 0;
  const [left, top, width, height] = bbox;
  const right = left + width;
  const bottom = top + height;
  if (!feather) return x >= left && x <= right && y >= top && y <= bottom ? 1 : 0;
  const dx = Math.max(left - x, 0, x - right);
  const dy = Math.max(top - y, 0, y - bottom);
  const outside = Math.hypot(dx, dy);
  if (outside > feather) return 0;
  if (x >= left && x <= right && y >= top && y <= bottom) return 1;
  return 1 - outside / feather;
}

function distanceToPolygon(x, y, polygon) {
  let best = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    best = Math.min(best, distanceToNormalizedSegment(x, y, polygon[j][0], polygon[j][1], polygon[i][0], polygon[i][1]));
  }
  return best;
}

function distanceToNormalizedSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function normalizeBbox(bbox) {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const values = bbox.slice(0, 4).map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;
  let [x, y, w, h] = values;
  if (w > 1 || h > 1 || x > 1 || y > 1) {
    x /= 100;
    y /= 100;
    w /= 100;
    h /= 100;
  }
  if (x + w > 1.08 && w > x) w -= x;
  if (y + h > 1.08 && h > y) h -= y;
  return [
    Math.max(0, Math.min(1, x)),
    Math.max(0, Math.min(1, y)),
    Math.max(0, Math.min(1, w)),
    Math.max(0, Math.min(1, h))
  ];
}

function normalizePolygon(polygon) {
  if (!Array.isArray(polygon)) return [];
  return polygon
    .map((point) => Array.isArray(point) ? point.slice(0, 2).map(Number) : [Number(point?.x), Number(point?.y)])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y]) => {
      const nx = x > 1 ? x / 100 : x;
      const ny = y > 1 ? y / 100 : y;
      return [Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny))];
    });
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / Math.max(0.000001, yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function setWidgetValue(node, name, value) {
  const widget = node.widgets?.find((item) => item.name === name);
  if (widget) widget.value = value;
}

function numericWidgetAtEvent(event) {
  if (!graphCanvas || !graph) return null;
  const point = graphPointFromEvent(event);
  const node = graph.getNodeOnPos(point[0], point[1], graphCanvas.visible_nodes, 5);
  if (!node?.widgets?.length || node.flags?.collapsed) return null;
  const localX = point[0] - node.pos[0];
  const localY = point[1] - node.pos[1];
  const width = node.size?.[0] || 0;

  for (const widget of node.widgets) {
    if (!widget || widget.disabled || !["slider", "number"].includes(widget.type)) continue;
    const height = widget.computeSize ? widget.computeSize(width)[1] : LiteGraph.NODE_WIDGET_HEIGHT;
    const widgetWidth = widget.width || width;
    const y = widget.last_y ?? widget.y;
    if (y === undefined) continue;
    if (localX >= 6 && localX <= widgetWidth - 12 && localY >= y && localY <= y + height) {
      return { node, widget };
    }
  }
  return null;
}

function promptNumericWidgetValue(node, widget, event) {
  const precision = widget.options?.precision ?? 3;
  const current = Number(widget.value);
  const initial = Number.isFinite(current) ? Number(current.toFixed(precision)) : widget.value;
  graphCanvas.prompt(widget.name || "Value", initial, (rawValue) => {
    const nextValue = parseNumericInput(rawValue);
    if (!Number.isFinite(nextValue)) return;
    const clamped = clampWidgetValue(nextValue, widget);
    widget.value = clamped;
    widget.callback?.(clamped, graphCanvas, node, null, event);
    runGraphOnce();
    scheduleUndoSnapshot();
  }, event);
}

function parseNumericInput(value) {
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  if (!/^[\d+\-*/().\s]+$/.test(text)) return Number(text);
  try {
    return Number(Function(`"use strict"; return (${text});`)());
  } catch {
    return Number(text);
  }
}

function clampWidgetValue(value, widget) {
  const min = widget.options?.min;
  const max = widget.options?.max;
  return clampNumber(value, Number.isFinite(min) ? min : -Infinity, Number.isFinite(max) ? max : Infinity);
}

function renderLibrary() {
  nodeLibrary.innerHTML = "";
  const mode = document.createElement("div");
  mode.className = "library-mode";
  ["Process", "Data"].forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.className = state.libraryMode === name ? "active" : "";
    button.addEventListener("click", () => {
      state.libraryMode = name;
      savePanelState();
      renderLibrary();
    });
    mode.appendChild(button);
  });
  nodeLibrary.appendChild(mode);

  for (const groupDef of libraryGroups()) {
    const groupKey = libraryGroupKey(groupDef.name);
    const isCollapsed = state.collapsedLibraryGroups.has(groupKey);
    const group = document.createElement("section");
    group.className = isCollapsed ? "category collapsed" : "category";
    const title = document.createElement("button");
    title.className = "category-toggle";
    title.type = "button";
    title.setAttribute("aria-expanded", String(!isCollapsed));
    title.innerHTML = `<span>${groupDef.name}</span><span>${isCollapsed ? "+" : "-"}</span>`;
    title.addEventListener("click", () => {
      if (state.collapsedLibraryGroups.has(groupKey)) {
        state.collapsedLibraryGroups.delete(groupKey);
      } else {
        state.collapsedLibraryGroups.add(groupKey);
      }
      savePanelState();
      renderLibrary();
    });
    const list = document.createElement("div");
    list.className = "node-list";
    groupDef.nodes.forEach((node) => {
      const button = document.createElement("button");
      button.className = "node-button";
      button.type = "button";
      button.textContent = node.title;
      button.draggable = true;
      button.addEventListener("click", () => addGraphNode(node.type, { linkId: currentInsertLinkId() }));
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("application/x-nomadic-node", node.type);
        event.dataTransfer.effectAllowed = "copy";
      });
      list.appendChild(button);
    });
    group.append(title, list);
    nodeLibrary.appendChild(group);
  }
}

function libraryGroupKey(name) {
  return `${state.libraryMode}:${name}`;
}

function libraryGroups() {
  if (state.libraryMode === "Process") return nodeGroups;
  const typeOrder = ["image", "audio", "tiles", "selector", "shape", "points", "field", "traces", "cells", "artifact", "layers", "value", "array", "color"];
  return typeOrder
    .map((type) => ({
      name: readableType(type),
      nodes: Array.from(nodeDefs.values()).filter((node) => outputTypesFor(node).includes(type))
    }))
    .filter((group) => group.nodes.length);
}

function outputTypesFor(node) {
  return String(node.output || "").split(",").filter(Boolean);
}

function setupGraph() {
  registerNomadicNodes();
  hideForeignNodeTypes();
  graph = new LGraph();
  graph.on_change = scheduleUndoSnapshot;
  graph.onAfterChange = scheduleUndoSnapshot;
  resizeGraphCanvas();
  graphCanvas = new LGraphCanvas("#graphCanvas", graph);
  graphCanvas.render_shadows = false;
  graphCanvas.title_text_font = `600 ${LiteGraph.NODE_TEXT_SIZE}px ${UI_FONT}`;
  graphCanvas.inner_text_font = `normal ${LiteGraph.NODE_SUBTEXT_SIZE}px ${UI_FONT}`;
  graphCanvas.ds.offset = [80, 80];
  graphCanvas.ds.scale = 1;
  graphCanvas.onNodeSelected = selectGraphNode;
  graphCanvas.onNodeDeselected = () => selectGraphNode(null);
  graphCanvas.getMenuOptions = nomadicCanvasMenuOptions;
  bindGraphCanvasInsertEvents();
  bindPreciseNumericInput();
  applyTheme(state.theme, { persist: false });
  runGraphOnce();
  workflowTitle.textContent = "Manual Geometry Graph";
}

function hideForeignNodeTypes() {
  Object.keys(LiteGraph.registered_node_types).forEach((type) => {
    if (!nodeDefs.has(type)) delete LiteGraph.registered_node_types[type];
  });
}

function nomadicCanvasMenuOptions() {
  return nodeGroups.map((group) => ({
    content: group.name,
    has_submenu: true,
    submenu: {
      options: group.nodes.map((node) => ({
        content: node.title,
        callback: () => addGraphNode(node.type, { position: state.lastContextPoint })
      }))
    }
  }));
}

function addGraphNode(type, options = {}) {
  const node = LiteGraph.createNode(type);
  const def = nodeDefs.get(type);
  const count = state.addCounts[def.group] || 0;
  state.addCounts[def.group] = count + 1;
  const insertPlan = planLinkInsertion(node, options.linkId || linkIdForDropPoint(options.position, node));
  node.pos = insertPlan
    ? positionForInsertedNode(insertPlan.link, node, options.position)
    : options.position
      ? positionForPointInCurrentView(options.position, node)
      : positionForNewNodeInCurrentView(node, count);
  graph.add(node);
  if (insertPlan) insertNodeIntoLink(node, insertPlan);
  graphCanvas.selectNode(node);
  selectGraphNode(node);
  runGraphOnce();
  scheduleUndoSnapshot();
}

function bindGraphCanvasInsertEvents() {
  graphCanvasElement.addEventListener("mousemove", (event) => {
    state.lastCanvasPoint = graphPointFromEvent(event);
    setHoveredInsertLink(findNearestLinkId(state.lastCanvasPoint));
  });

  graphCanvasElement.addEventListener("mousedown", (event) => {
    const point = graphPointFromEvent(event);
    const node = graph.getNodeOnPos(point[0], point[1], graphCanvas.visible_nodes, 5);
    state.draggingNodeForInsert = node ? {
      node,
      startX: node.pos?.[0] ?? 0,
      startY: node.pos?.[1] ?? 0
    } : null;
  });

  graphCanvasElement.addEventListener("mouseup", (event) => {
    const drag = state.draggingNodeForInsert;
    state.draggingNodeForInsert = null;
    if (!drag?.node || drag.node.flags?.collapsed) return;
    const moved = Math.hypot((drag.node.pos?.[0] ?? 0) - drag.startX, (drag.node.pos?.[1] ?? 0) - drag.startY);
    if (moved < 8) return;
    window.setTimeout(() => maybeInsertExistingNodeOnLink(drag.node, graphPointFromEvent(event)), 0);
  });

  graphCanvasElement.addEventListener("mouseleave", () => {
    if (!state.selectedLinkId) setHoveredInsertLink(null);
  });

  graphCanvasElement.addEventListener("click", (event) => {
    const point = graphPointFromEvent(event);
    if (graph.getNodeOnPos(point[0], point[1], graphCanvas.visible_nodes, 4)) return;
    setSelectedInsertLink(findNearestLinkId(point));
  });

  graphCanvasElement.addEventListener("contextmenu", (event) => {
    const point = graphPointFromEvent(event);
    state.lastCanvasPoint = point;
    state.lastContextPoint = point;
    const linkId = findNearestLinkId(point);
    if (linkId) setSelectedInsertLink(linkId);
  });

  graphCanvasElement.addEventListener("dragover", (event) => {
    if (!event.dataTransfer.types.includes("application/x-nomadic-node")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    const point = graphPointFromEvent(event);
    state.lastCanvasPoint = point;
    setHoveredInsertLink(findNearestLinkId(point));
  });

  graphCanvasElement.addEventListener("drop", (event) => {
    const type = event.dataTransfer.getData("application/x-nomadic-node");
    if (!type) return;
    event.preventDefault();
    const point = graphPointFromEvent(event);
    addGraphNode(type, { position: point });
  });
}

function bindPreciseNumericInput() {
  graphCanvasElement.addEventListener("dblclick", (event) => {
    const hit = numericWidgetAtEvent(event);
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    promptNumericWidgetValue(hit.node, hit.widget, event);
  }, true);
}

function graphPointFromEvent(event) {
  const rect = graphCanvasElement.getBoundingClientRect();
  const canvasPoint = [
    (event.clientX - rect.left) * (graphCanvasElement.width / Math.max(1, rect.width)),
    (event.clientY - rect.top) * (graphCanvasElement.height / Math.max(1, rect.height))
  ];
  return graphCanvas.convertCanvasToOffset(canvasPoint);
}

function setHoveredInsertLink(linkId) {
  if (state.hoveredLinkId === linkId) return;
  state.hoveredLinkId = linkId;
  updateInsertLinkHighlight();
}

function setSelectedInsertLink(linkId) {
  if (state.selectedLinkId === linkId) return;
  state.selectedLinkId = linkId;
  updateInsertLinkHighlight();
}

function currentInsertLinkId() {
  return graph?.links?.[state.selectedLinkId] ? state.selectedLinkId : graph?.links?.[state.hoveredLinkId] ? state.hoveredLinkId : null;
}

function updateInsertLinkHighlight() {
  const linkId = graph?.links?.[state.selectedLinkId] ? state.selectedLinkId : state.hoveredLinkId;
  if (!graphCanvas?.highlighted_links) return;
  if (state.highlightedInsertLinkId && state.highlightedInsertLinkId !== linkId) {
    delete graphCanvas.highlighted_links[state.highlightedInsertLinkId];
  }
  state.highlightedInsertLinkId = graph?.links?.[linkId] ? linkId : null;
  if (state.highlightedInsertLinkId) graphCanvas.highlighted_links[state.highlightedInsertLinkId] = true;
  graphCanvas.setDirty(true, true);
}

function clearInsertLinkSelection() {
  state.selectedLinkId = null;
  state.hoveredLinkId = null;
  updateInsertLinkHighlight();
}

function planLinkInsertion(node, preferredLinkId = null, options = {}) {
  const link = graph?.links?.[preferredLinkId] || graph?.links?.[state.selectedLinkId] || graph?.links?.[state.hoveredLinkId];
  if (!link) return null;
  const origin = graph.getNodeById(link.origin_id);
  const target = graph.getNodeById(link.target_id);
  const originOutput = origin?.outputs?.[link.origin_slot];
  const targetInput = target?.inputs?.[link.target_slot];
  if (!origin || !target || !originOutput || !targetInput || !node.inputs || !node.outputs) return null;
  if (origin === node || target === node) return null;

  const inputSlot = node.inputs.findIndex((input) => LiteGraph.isValidConnection(originOutput.type, input.type));
  const outputSlot = node.outputs.findIndex((output) => LiteGraph.isValidConnection(output.type, targetInput.type));
  if (inputSlot < 0 || outputSlot < 0) return null;
  if (options.requireFreeSlots && (node.inputs[inputSlot]?.link != null || node.outputs[outputSlot]?.links?.length)) return null;
  return { link, origin, target, inputSlot, outputSlot };
}

function maybeInsertExistingNodeOnLink(node, dropPoint) {
  if (!graph?._nodes?.includes(node)) return;
  const linkId = linkIdForNodePlacement(node, dropPoint);
  const plan = planLinkInsertion(node, linkId, { requireFreeSlots: true });
  if (!plan) return;
  insertNodeIntoLink(node, plan);
  runGraphOnce();
  scheduleUndoSnapshot();
}

function linkIdForDropPoint(point, node = null) {
  if (!point) return currentInsertLinkId();
  const candidates = [point];
  if (node?.size) {
    candidates.push(
      [point[0] - node.size[0] * 0.45, point[1]],
      [point[0] + node.size[0] * 0.45, point[1]],
      [point[0], point[1] - node.size[1] * 0.35],
      [point[0], point[1] + node.size[1] * 0.35]
    );
  }
  for (const candidate of candidates) {
    const linkId = findNearestLinkId(candidate, LINK_DROP_HIT_TARGET_PX);
    if (linkId) return linkId;
  }
  return currentInsertLinkId();
}

function linkIdForNodePlacement(node, dropPoint = null) {
  const center = nodeCenterPoint(node);
  const candidates = [
    center,
    dropPoint,
    [node.pos[0], center[1]],
    [node.pos[0] + node.size[0], center[1]],
    [center[0], node.pos[1]],
    [center[0], node.pos[1] + node.size[1]]
  ].filter(Boolean);
  for (const candidate of candidates) {
    const linkId = findNearestLinkId(candidate, LINK_DROP_HIT_TARGET_PX);
    if (linkId) return linkId;
  }
  return null;
}

function nodeCenterPoint(node) {
  return [
    (node.pos?.[0] || 0) + (node.size?.[0] || 0) * 0.5,
    (node.pos?.[1] || 0) + (node.size?.[1] || 0) * 0.5
  ];
}

function insertNodeIntoLink(node, plan) {
  const firstLink = plan.origin.connect(plan.link.origin_slot, node, plan.inputSlot);
  const secondLink = node.connect(plan.outputSlot, plan.target, plan.link.target_slot);
  if (!firstLink || !secondLink) {
    if (firstLink) graph.removeLink(firstLink.id);
    return;
  }
  clearInsertLinkSelection();
}

function positionForInsertedNode(link, node, preferredPoint = null) {
  const point = preferredPoint || linkMidpoint(link) || state.lastCanvasPoint || [0, 0];
  return [point[0] - node.size[0] * 0.5, point[1] - node.size[1] * 0.5];
}

function positionForPointInCurrentView(point, node) {
  return clampNodePositionToCurrentView([point[0] - node.size[0] * 0.5, point[1] - node.size[1] * 0.5], node);
}

function findNearestLinkId(point, hitTargetPx = LINK_INSERT_HIT_TARGET_PX) {
  if (!point || !graph?.links) return null;
  const maxDistance = hitTargetPx / Math.max(0.2, graphCanvas.ds.scale);
  let bestId = null;
  let bestDistance = maxDistance;
  Object.values(graph.links).forEach((link) => {
    const distance = distanceToLink(point, link);
    if (distance <= bestDistance) {
      bestDistance = distance;
      bestId = link.id;
    }
  });
  return bestId;
}

function distanceToLink(point, link) {
  const ends = linkEndpoints(link);
  if (!ends) return Infinity;
  let best = Infinity;
  let previous = ends.start;
  for (let index = 1; index <= LINK_HIT_SAMPLE_COUNT; index += 1) {
    const next = linkBezierPoint(ends.start, ends.end, index / LINK_HIT_SAMPLE_COUNT);
    best = Math.min(best, pointToSegmentDistance(point, previous, next));
    previous = next;
  }
  return best;
}

function linkMidpoint(link) {
  const ends = linkEndpoints(link);
  return ends ? linkBezierPoint(ends.start, ends.end, 0.5) : null;
}

function linkEndpoints(link) {
  const origin = graph.getNodeById(link.origin_id);
  const target = graph.getNodeById(link.target_id);
  if (!origin || !target) return null;
  return {
    start: origin.getConnectionPos(false, link.origin_slot),
    end: target.getConnectionPos(true, link.target_slot)
  };
}

function linkBezierPoint(start, end, t) {
  const dist = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const c1 = [start[0] + dist * 0.25, start[1]];
  const c2 = [end[0] - dist * 0.25, end[1]];
  const inv = 1 - t;
  return [
    inv ** 3 * start[0] + 3 * inv ** 2 * t * c1[0] + 3 * inv * t ** 2 * c2[0] + t ** 3 * end[0],
    inv ** 3 * start[1] + 3 * inv ** 2 * t * c1[1] + 3 * inv * t ** 2 * c2[1] + t ** 3 * end[1]
  ];
}

function pointToSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = clampNumber(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point[0] - (start[0] + dx * t), point[1] - (start[1] + dy * t));
}

function positionForNewNode(group, count) {
  const columns = {
    Source: 60,
    Audio: 320,
    AI: 320,
    Geometry: 580,
    Convert: 840,
    Field: 1040,
    Boolean: 1240,
    Process: 1480,
    Material: 1740,
    Style: 2000,
    Math: 2260,
    Output: 900
  };
  const rows = {
    Source: 120,
    Audio: 120,
    AI: 120,
    Geometry: 120,
    Convert: 120,
    Field: 120,
    Boolean: 120,
    Process: 120,
    Material: 120,
    Style: 120,
    Math: 120,
    Output: 360
  };
  const rowStep = group === "Output" ? 560 : 190;
  return [columns[group] || 120, (rows[group] || 120) + count * rowStep];
}

function positionForNewNodeInCurrentView(node, count) {
  if (!graphCanvas) return positionForNewNode(nodeDefs.get(node.properties?.type)?.group || "Source", count);
  const center = graphCanvas.convertCanvasToOffset([graphCanvasElement.width * 0.5, graphCanvasElement.height * 0.5]);
  const offsets = [
    [0, 0],
    [36, 36],
    [-36, 36],
    [36, -36],
    [-36, -36],
    [72, 0],
    [-72, 0],
    [0, 72],
    [0, -72]
  ];
  const offset = offsets[count % offsets.length];
  const wanted = [
    center[0] - node.size[0] * 0.5 + offset[0],
    center[1] - node.size[1] * 0.5 + offset[1]
  ];
  return clampNodePositionToCurrentView(wanted, node);
}

function clampNodePositionToCurrentView(position, node) {
  const padding = 24 / Math.max(0.2, graphCanvas.ds.scale);
  const topLeft = graphCanvas.convertCanvasToOffset([0, 0]);
  const bottomRight = graphCanvas.convertCanvasToOffset([graphCanvasElement.width, graphCanvasElement.height]);
  const minX = Math.min(topLeft[0], bottomRight[0]) + padding;
  const maxX = Math.max(topLeft[0], bottomRight[0]) - node.size[0] - padding;
  const minY = Math.min(topLeft[1], bottomRight[1]) + padding;
  const maxY = Math.max(topLeft[1], bottomRight[1]) - node.size[1] - padding;
  return [
    maxX >= minX ? clampNumber(position[0], minX, maxX) : position[0],
    maxY >= minY ? clampNumber(position[1], minY, maxY) : position[1]
  ];
}

function selectGraphNode(node) {
  state.selectedNode = node;
  const def = node ? nodeDefs.get(node.properties?.type) : null;
  selectedNodeName.textContent = node ? node.title : "No Node Selected";
  nodeDescription.textContent = def ? descriptionFor(def) : "Add a source node, then connect typed geometry through the graph.";
  outputTraits.innerHTML = node ? inspectorRows(node).map((item) => `<li>${item}</li>`).join("") : "";
  drawInspectorPreview(node?.lastOutput || null);
}

function descriptionFor(def) {
  if (def.preview) return `${def.description} Accepts: ${readableType(def.input)}.`;
  const required = inputDefsFor(def).filter((input) => !input.optional).map((input) => readableType(input.type));
  if (!required.length) return `${def.description} Outputs: ${readableType(def.output)}.`;
  return `${def.description} Requires: ${required.join(" / ")}. Outputs: ${readableType(def.output)}.`;
}

function inspectorRows(node) {
  const def = nodeDefs.get(node.properties?.type);
  const inputs = (node.inputs || []).map((input) => `Input: ${input.name} (${readableType(input.type)})`);
  const outputs = (node.outputs || []).map((output) => `Output: ${output.name} (${readableType(output.type)})`);
  const widgets = [
    ...(def && !def.preview ? ["Control: Bypass"] : []),
    ...(def?.widgets || []).map(([, name]) => `Control: ${name}`)
  ];
  const data = dataSummary(node.lastOutput).map((item) => `Data: ${item}`);
  return [...inputs, ...outputs, ...widgets, ...data];
}

function dataSummary(data) {
  if (!data) return ["no output"];
  const rows = [`type: ${data.ngType}`];
  Object.entries(data.stats || {}).forEach(([key, value]) => rows.push(`${key}: ${value}`));
  if (data.history?.length) rows.push(`history: ${data.history.join(" -> ")}`);
  return rows;
}

function drawInspectorPreview(data) {
  if (!inspectorPreview) return;
  resizeInspectorPreview(data);
  const ctx = inspectorPreview.getContext("2d");
  NomadicGeometry.draw(ctx, data, {
    x: 0,
    y: 0,
    width: inspectorPreview.width,
    height: inspectorPreview.height,
    background: "Paper",
    backgroundColor: "#f8f5eb",
    grid: "On"
  });
}

function resizeInspectorPreview(data) {
  const bounds = isImageDerivedData(data) ? dataBounds(data) : null;
  if (!bounds) {
    inspectorPreview.width = 520;
    inspectorPreview.height = 360;
    inspectorPreview.style.aspectRatio = "13 / 9";
    return;
  }
  const aspect = clampNumber((bounds.maxX - bounds.minX + 92) / Math.max(1, bounds.maxY - bounds.minY + 92), 0.28, 1.7);
  inspectorPreview.width = 520;
  inspectorPreview.height = Math.round(clampNumber(520 / aspect, 320, 760));
  inspectorPreview.style.aspectRatio = `${inspectorPreview.width} / ${inspectorPreview.height}`;
}

function runGraphOnce() {
  if (!graph) return;
  repairNodePositions();
  refreshImageInputs();
  graph.runStep(6);
  if (state.selectedNode) selectGraphNode(state.selectedNode);
  if (graphCanvas) graphCanvas.setDirty(true, true);
}

function repairNodePositions() {
  graph._nodes.forEach((node, index) => {
    if (Number.isFinite(node.pos?.[0]) && Number.isFinite(node.pos?.[1])) return;
    const def = nodeDefs.get(node.properties?.type);
    node.pos = positionForNewNode(def?.group || "Source", index);
  });
}

function refreshImageInputs() {
  graph._nodes
    .filter((node) => node.properties?.type === "nomadic/source/image_input" || node.properties?.type === "nomadic/source/image_field_input" || node.properties?.type === "nomadic/source/gpt_image")
    .filter((node) => node.properties.image_data_url && node.properties.image_sampling_version !== 4 && !node.properties.image_refreshing)
    .forEach((node) => {
      node.properties.image_refreshing = true;
      loadImageField(node.properties.image_data_url).then((imageData) => {
        Object.assign(node.properties, imageData);
        node.properties.image_refreshing = false;
        runGraphOnce();
      });
    });
}

function resizeGraphCanvas() {
  const rect = graphCanvasElement.parentElement.getBoundingClientRect();
  graphCanvasElement.width = Math.max(1, Math.floor(rect.width));
  graphCanvasElement.height = Math.max(1, Math.floor(rect.height));
  if (graphCanvas) graphCanvas.resize();
}

function fitGraphView() {
  graphCanvas.ds.offset = [80, 80];
  graphCanvas.ds.scale = 1;
  graphCanvas.setDirty(true, true);
}

function exportPng() {
  runGraphOnce();
  const exportScale = parseExportScale(state.lastPreviewOptions.export_scale);
  const exportSize = previewExportSize(state.lastPreviewOptions, state.lastPreview);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(exportSize.width * exportScale));
  canvas.height = Math.max(1, Math.round(exportSize.height * exportScale));
  NomadicGeometry.draw(canvas.getContext("2d"), state.lastPreview, {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    background: state.lastPreviewOptions.background,
    backgroundColor: state.lastPreviewOptions.background_color,
    grid: state.lastPreviewOptions.grid,
    canvasSize: state.lastPreviewOptions.canvas_size,
    artboardWidth: state.lastPreviewOptions.width,
    artboardHeight: state.lastPreviewOptions.height,
    fit: state.lastPreviewOptions.fit
  });
  canvas.toBlob((blob) => downloadBlob(blob, "nomadic-graphics.png"));
}

function exportSvg() {
  runGraphOnce();
  downloadBlob(new Blob([NomadicGeometry.toSvg(state.lastPreview, previewGeometryOptions(state.lastPreviewOptions))], { type: "image/svg+xml" }), "nomadic-graphics.svg");
}

function parseExportScale(value) {
  const parsed = Number(String(value || "2x").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

function previewExportSize(options = {}, data = null) {
  if ((options.canvas_size || "Default") === "From Image") {
    const image = firstImageData(data);
    if (image?.originalWidth && image?.originalHeight) {
      return { width: Number(image.originalWidth), height: Number(image.originalHeight) };
    }
  }
  return previewArtboard(options, data);
}

function previewGeometryOptions(options = {}) {
  return {
    ...options,
    canvasSize: options.canvas_size,
    artboardWidth: options.width,
    artboardHeight: options.height
  };
}

function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function currentPatch({ includeSavedAt = false, includeTheme = true } = {}) {
  const patch = {
    app: "Nomadic Graphics",
    version: 1,
    seed: state.seed,
    canvas: graphCanvas ? {
      offset: [...graphCanvas.ds.offset],
      scale: graphCanvas.ds.scale
    } : null,
    graph: graph.serialize()
  };
  if (includeTheme) patch.theme = state.theme;
  if (includeSavedAt) patch.savedAt = new Date().toISOString();
  return patch;
}

function patchSnapshotJson() {
  return JSON.stringify(currentPatch({ includeTheme: false }));
}

function resetUndoHistory() {
  if (!graph) return;
  const snapshot = patchSnapshotJson();
  state.undoStack = [snapshot];
  state.undoIndex = 0;
  state.lastUndoSnapshot = snapshot;
  updatePatchControls();
}

function scheduleUndoSnapshot() {
  if (state.isRestoring || !graph) return;
  window.clearTimeout(state.undoTimer);
  state.undoTimer = window.setTimeout(pushUndoSnapshot, 220);
}

function pushUndoSnapshot() {
  if (state.isRestoring || !graph) return;
  const snapshot = patchSnapshotJson();
  if (snapshot === state.lastUndoSnapshot) {
    updatePatchControls();
    return;
  }
  if (state.undoIndex < state.undoStack.length - 1) {
    state.undoStack.splice(state.undoIndex + 1);
  }
  state.undoStack.push(snapshot);
  if (state.undoStack.length > UNDO_LIMIT) {
    state.undoStack.shift();
  } else {
    state.undoIndex += 1;
  }
  state.lastUndoSnapshot = snapshot;
  updatePatchControls();
}

function undoPatch() {
  if (state.undoIndex <= 0) return;
  state.undoIndex -= 1;
  restoreUndoSnapshot(state.undoStack[state.undoIndex]);
}

function redoPatch() {
  if (state.undoIndex >= state.undoStack.length - 1) return;
  state.undoIndex += 1;
  restoreUndoSnapshot(state.undoStack[state.undoIndex]);
}

function restoreUndoSnapshot(snapshot) {
  const patch = JSON.parse(snapshot);
  applyPatch(patch, { resetHistory: false, applyPatchTheme: false });
  state.lastUndoSnapshot = snapshot;
  updatePatchControls();
}

function savePatchToStorage() {
  const saved = writeStoredValue(PATCH_STORAGE_KEY, JSON.stringify(currentPatch({ includeSavedAt: true })));
  flashButton(savePatchButton, saved ? "Saved" : "Full");
  updatePatchControls();
}

function loadPatchFromStorage() {
  const text = readStoredValue(PATCH_STORAGE_KEY);
  if (!text) {
    flashButton(loadPatchButton, "None");
    return;
  }
  if (loadPatchText(text)) flashButton(loadPatchButton, "Loaded");
}

function exportPatch() {
  const text = JSON.stringify(currentPatch({ includeSavedAt: true }), null, 2);
  downloadBlob(new Blob([text], { type: "application/json" }), "nomadic-graphics.patch.json");
}

function openPatchFile() {
  readLocalFile(".json,application/json", "text").then((text) => {
    if (!text) return;
    if (loadPatchText(text)) flashButton(openPatchButton, "Opened");
  });
}

function loadPatchText(text) {
  try {
    const patch = JSON.parse(text);
    return applyPatch(patch);
  } catch {
    flashButton(openPatchButton, "Bad file");
    return false;
  }
}

function applyPatch(patch, { resetHistory = true, applyPatchTheme = true } = {}) {
  const graphData = patch?.graph || patch;
  if (!graphData?.nodes) return false;
  state.isRestoring = true;
  window.clearTimeout(state.undoTimer);
  state.selectedLinkId = null;
  state.hoveredLinkId = null;
  state.highlightedInsertLinkId = null;
  if (graphCanvas?.highlighted_links) graphCanvas.highlighted_links = {};
  graph.configure(graphData);
  graphCanvas.deselectAllNodes();
  state.seed = Number(patch.seed ?? state.seed);
  if (patch.canvas?.offset && graphCanvas) graphCanvas.ds.offset = [...patch.canvas.offset];
  if (Number.isFinite(patch.canvas?.scale) && graphCanvas) graphCanvas.ds.scale = patch.canvas.scale;
  syncAddCountsFromGraph();
  state.lastPreview = null;
  state.lastPreviewOptions = {};
  state.isRestoring = false;
  if (applyPatchTheme && patch.theme) applyTheme(patch.theme);
  runGraphOnce();
  selectGraphNode(null);
  if (resetHistory) resetUndoHistory();
  updatePatchControls();
  return true;
}

function syncAddCountsFromGraph() {
  state.addCounts = {};
  graph._nodes.forEach((node) => {
    const def = nodeDefs.get(node.properties?.type);
    if (!def) return;
    state.addCounts[def.group] = (state.addCounts[def.group] || 0) + 1;
  });
}

function applyTheme(theme, { persist = true } = {}) {
  const nextTheme = ["paper", "survey", "night"].includes(theme) ? theme : "paper";
  state.theme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  if (themeSelect) themeSelect.value = nextTheme;
  if (persist) writeStoredValue(THEME_STORAGE_KEY, nextTheme);
  if (graphCanvas) {
    graphCanvas.clear_background_color = getComputedStyle(document.documentElement).getPropertyValue("--graph-bg").trim() || "#e9e3d6";
    graphCanvas.setDirty(true, true);
  }
}

function updatePatchControls() {
  if (undoButton) undoButton.disabled = state.undoIndex <= 0;
  if (redoButton) redoButton.disabled = state.undoIndex >= state.undoStack.length - 1;
  if (loadPatchButton) loadPatchButton.disabled = !readStoredValue(PATCH_STORAGE_KEY);
}

function flashButton(button, text) {
  if (!button) return;
  const label = button.dataset.label || button.textContent;
  button.dataset.label = label;
  button.textContent = text;
  window.clearTimeout(button._flashTimer);
  button._flashTimer = window.setTimeout(() => {
    button.textContent = button.dataset.label;
  }, 900);
}

function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function openGptImageCacheDb() {
  if (!window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(GPT_IMAGE_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GPT_IMAGE_CACHE_STORE)) db.createObjectStore(GPT_IMAGE_CACHE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function gptImageCacheKey(payload) {
  const text = JSON.stringify(Object.keys(payload).sort().reduce((result, key) => {
    result[key] = payload[key];
    return result;
  }, {}));
  if (!crypto?.subtle) return `plain:${text}`;
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readGptImageCache(key) {
  const db = await openGptImageCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction(GPT_IMAGE_CACHE_STORE, "readonly").objectStore(GPT_IMAGE_CACHE_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

async function writeGptImageCache(key, payload) {
  try {
    const db = await openGptImageCacheDb();
    if (!db) return;
    const record = { ...payload, saved_at: new Date().toISOString() };
    await new Promise((resolve) => {
      const request = db.transaction(GPT_IMAGE_CACHE_STORE, "readwrite").objectStore(GPT_IMAGE_CACHE_STORE).put(record, key);
      request.onsuccess = resolve;
      request.onerror = resolve;
    });
  } catch {
    // Cache writes should never block image generation.
  }
}

function loadPanelState() {
  const raw = readStoredValue(PANEL_STATE_STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.libraryCollapsed = Boolean(saved.libraryCollapsed);
    state.inspectorCollapsed = Boolean(saved.inspectorCollapsed);
    state.collapsedLibraryGroups = new Set(Array.isArray(saved.collapsedLibraryGroups) ? saved.collapsedLibraryGroups : []);
  } catch {
    state.collapsedLibraryGroups = new Set();
  }
}

function savePanelState() {
  writeStoredValue(PANEL_STATE_STORAGE_KEY, JSON.stringify({
    libraryCollapsed: state.libraryCollapsed,
    inspectorCollapsed: state.inspectorCollapsed,
    collapsedLibraryGroups: Array.from(state.collapsedLibraryGroups)
  }));
}

function applyPanelState() {
  window.scrollTo(0, 0);

  appShell.classList.toggle("library-collapsed", state.libraryCollapsed);
  appShell.classList.toggle("inspector-collapsed", state.inspectorCollapsed);

  toggleLibraryPanel.title = state.libraryCollapsed ? "Expand node library" : "Collapse node library";
  toggleLibraryPanel.setAttribute("aria-label", toggleLibraryPanel.title);
  toggleLibraryPanel.setAttribute("aria-expanded", String(!state.libraryCollapsed));

  toggleInspectorPanel.title = state.inspectorCollapsed ? "Expand node inspector" : "Collapse node inspector";
  toggleInspectorPanel.setAttribute("aria-label", toggleInspectorPanel.title);
  toggleInspectorPanel.setAttribute("aria-expanded", String(!state.inspectorCollapsed));

  window.requestAnimationFrame(resizeGraphCanvas);
  window.setTimeout(resizeGraphCanvas, 180);
}

function togglePanel(name) {
  if (name === "library") state.libraryCollapsed = !state.libraryCollapsed;
  if (name === "inspector") state.inspectorCollapsed = !state.inspectorCollapsed;
  applyPanelState();
  savePanelState();
}

function handleKeyboardShortcuts(event) {
  const target = event.target;
  const isEditable = target?.matches?.("input, textarea, select") || target?.isContentEditable;
  if (isEditable || (!event.ctrlKey && !event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === "z") {
    event.preventDefault();
    if (event.shiftKey) redoPatch();
    else undoPatch();
  }
  if (key === "y") {
    event.preventDefault();
    redoPatch();
  }
}

document.querySelector("#randomizeButton").addEventListener("click", () => {
  state.seed += 1;
  runGraphOnce();
  scheduleUndoSnapshot();
});
undoButton.addEventListener("click", undoPatch);
redoButton.addEventListener("click", redoPatch);
savePatchButton.addEventListener("click", savePatchToStorage);
loadPatchButton.addEventListener("click", loadPatchFromStorage);
exportPatchButton.addEventListener("click", exportPatch);
openPatchButton.addEventListener("click", openPatchFile);
themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
toggleLibraryPanel.addEventListener("click", () => togglePanel("library"));
toggleInspectorPanel.addEventListener("click", () => togglePanel("inspector"));
document.querySelector("#fitButton").addEventListener("click", fitGraphView);
document.querySelector("#exportSvgButton").addEventListener("click", exportSvg);
document.querySelector("#exportPngButton").addEventListener("click", exportPng);
window.addEventListener("resize", resizeGraphCanvas);
window.addEventListener("keydown", handleKeyboardShortcuts);

loadPanelState();
applyTheme(readStoredValue(THEME_STORAGE_KEY), { persist: false });
applyPanelState();
renderLibrary();
setupGraph();
selectGraphNode(null);
resetUndoHistory();
