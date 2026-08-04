# Synth.Eye GAN — Empowering Vision-Based Industrial AI with Synthetic Data
 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)
[![Python 3.7+](https://img.shields.io/badge/Python-3.7%2B-blue.svg)](https://www.python.org/downloads/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey.svg)]()
[![CUDA Required](https://img.shields.io/badge/CUDA-Required-76B900.svg)](https://developer.nvidia.com/cuda-downloads)
 
<p align="center">
  <img src="images/Logo_White.png" width="800" height="400" alt="Synth.Eye GAN logo">
</p>
## Project Description
 
**Synth.Eye GAN** is a data-driven extension of the [Synth.Eye](https://github.com/rparak/Synth_Eye) platform that replaces physics-based Blender rendering with **generative adversarial networks ([StyleGAN2-ADA](https://arxiv.org/abs/2006.06676))**. Where Synth.Eye virtualizes cameras, lighting, and materials to produce rendered images, Synth.Eye GAN learns the visual distribution of real industrial parts and fingerprint residues directly from data — generating highly realistic synthetic images orders of magnitude faster than a traditional render pipeline.
 
The platform supports the complete workflow required for **vision-based surface defect detection** in manufacturing environments:
 
1. **Synthetic data generation** — three independent StyleGAN2-ADA models generate images: `front.pkl` (front-side objects), `back.pkl` (back-side objects), and `fingerprint.pkl` (fingerprint residues). A compositing pipeline blends front-side and fingerprint images together with physically motivated augmentations (pressure simulation, motion blur, alpha feathering, blend-mode variation) to produce labeled training images at scale.
2. **Model training** — YOLO models are trained on the generated synthetic dataset, with no manual annotation required.
3. **Real-time inspection** — a PyQt5 desktop application connects to a Basler industrial camera, captures frames, and runs the trained YOLO models live to classify parts and detect fingerprint defects.
The project was developed as part of **internal research activities at the [JIC](https://www.jic.cz/en/)**, with a focus on advancing synthetic data generation for **industrial artificial intelligence and machine vision applications**.
 
> ⚠️ **Note:** The project is under active development. Interfaces, scripts, and workflows may change as the platform evolves.
 
---
 
## Architecture Overview
 
Synth.Eye GAN implements a **two-track synthetic data pipeline**:
 
| Track | Approach | Speed | Key Dependency |
|-------|----------|-------|----------------|
| **Blender (predecessor)** | Physics-based rendering — virtualizes cameras, lighting, and materials | Slow (render time per frame) | [Synth.Eye](https://github.com/rparak/Synth_Eye) / [Blender](https://www.blender.org/download/) |
| **GAN (this project)** | Data-driven — learns visual distribution from ~130 real images per class | Fast (milliseconds per image) | [StyleGAN2-ADA](https://github.com/LukasMoravansky/stylegan2-ada-pytorch) |
 
> **Note:** The Blender track represents the predecessor project [Synth.Eye](https://github.com/rparak/Synth_Eye) and is **not** part of Synth.Eye GAN — it is shown here for context only.
 
The GAN pipeline consists of three independent StyleGAN2-ADA generators and a multi-step compositing engine:
 
```
front.pkl (256×256)  ────────────────────────────────┐
                                                      ├──► Compositor ──► Labeled composite ──► YOLO training
fingerprint.pkl (128×128) ──► Alpha shaping ─────────┘                   (.png + .txt label)
                              Background removal
                              Pressure / blur / blend
 
back.pkl (256×256)   ─────────────────────────────────────────────────► Back-side images (no fingerprint) ──► YOLO training
```
 
The compositor chains eleven operations before blending the fingerprint onto the object:
background removal → alpha feathering → border fade → scale/rotate/place → color tinting →
opacity scaling → pressure noise → gradient modulation → motion blur → alpha dropout → intensity jitter →
final blend (alpha / multiply / overlay).
 
<p align="center">
  <img src="images/Real_World.png" alt="Real-world industrial inspection setup" width="680">
</p>
---
 
## Features
 
- **Data-driven synthesis** — StyleGAN2-ADA models trained on real industrial images; no CAD geometry or scene setup required.
- **Physically motivated compositing** — pressure noise, gradient modulation, motion blur, alpha dropout, feathering, and multiple blend modes (alpha / multiply / overlay) simulate the full range of real fingerprint appearances.
- **Fully automated annotation** — YOLO-format `.txt` labels and a `data.yaml` are written alongside each generated image; no manual labeling step.
- **Reproducible and resumable batches** — `--seed` and `--image-index-start` allow deterministic generation and seamless continuation of interrupted runs.
- **Modular pipeline** — generation, compositing, annotation, and background placement are independent steps that can be run together or separately.
- **Real-time inspection UI** — PyQt5 application with live Basler camera feed, YOLO-based object and defect detection, productivity graph, and system logger.
- **Optimized for industrial use** — designed for high-variability small-batch production; supports train / validation / test split generation out of the box.
---
 
## Repository Structure
 
```
Synth_Eye_GAN/
├── App/                          # PyQt5 desktop inspection application
│   ├── run.py                    # Application entry point
│   ├── Data/                     # Application runtime data and configs
│   └── fonts/                    # UI fonts
├── Data/                         # Raw and split datasets
│   ├── Dataset_v1/               # YOLO-format generated dataset
│   ├── Dataset_Front_Side/       # Front-side training images
│   ├── Dataset_Back_Side/        # Back-side training images
│   └── Dataset_Defect_Fingerprint/ # Fingerprint composite images
├── envs/                         # Conda and pip environment files
│   ├── environment.yml           # Conda env for synthesis pipeline
│   ├── environment_app.yml       # Conda env for the PyQt5 app
│   ├── requirements.txt          # pip requirements
│   └── requirements-dev.txt      # pip dev/optional requirements
├── Example/                      # Minimal runnable examples
│   ├── Camera/                   # Camera capture examples
│   ├── Dataset/                  # Example dataset samples
│   ├── Measurement/              # Measurement workflow examples
│   └── Model/                    # Pretrained model examples
├── Training/                     # YOLO training scripts
│   ├── train.py                  # Training entry point
│   ├── predict.py                # Inference script
│   ├── valid.py                  # Validation script
│   ├── Args_Model_1.yaml         # Config: object detection model
│   └── Args_Model_2.yaml         # Config: defect detection model
├── YOLO/                         # YOLO model artifacts
│   ├── Configuration/            # Dataset and model config YAML files
│   ├── Model/                    # Trained YOLO weights (.pt)
│   ├── Prediction/               # Inference outputs
│   └── Results/                  # Training metrics and curves
├── images/                       # Project images and pipeline output samples
│   ├── composite/                # Example composite outputs from Pipeline.py
│   └── Fingerprint/              # Parameter visualization images
├── models/                       # Pretrained StyleGAN2-ADA weights
│   ├── front.pkl                 # Front-side generator (256×256)
│   ├── back.pkl                  # Back-side generator (256×256)
│   └── fingerprint.pkl           # Fingerprint generator (128×128)
├── scripts/                      # Utility and environment scripts
│   ├── install/                  # One-command environment setup
│   │   ├── install_synthesis.ps1 # Synthesis env setup (PowerShell)
│   │   ├── install_app.ps1       # App env setup (PowerShell)
│   │   └── setup_fingerprint_env.bat # Fingerprint env setup (cmd)
│   └── ...                       # Verification and utility scripts
├── src/                          # Core library
│   ├── Synthesis/                # Pipeline.py, Generator.py, Compositor.py, Annotator.py
│   ├── Fingerprint/              # Fingerprint-specific processing modules
│   ├── Basler/                   # Basler camera interface (pypylon)
│   ├── Calibration/              # Camera calibration utilities
│   ├── Hub/                      # HuggingFace model download utilities
│   ├── Measurement/              # Measurement pipeline
│   ├── Parameters/               # Shared parameter definitions
│   ├── Transformation/           # Geometric transformation utilities
│   └── Utilities/                # Shared utility functions
└── vendor/
    └── stylegan2-ada-pytorch/    # StyleGAN2-ADA fork (clone separately — see below)
```
 
---
 
## Installation
 
### Prerequisites
 
- **OS:** Windows / Linux / macOS
- **GPU:** NVIDIA GPU with CUDA support (required for StyleGAN2-ADA inference)
- **[Miniconda](https://docs.conda.io/en/latest/miniconda.html)**
- **Git**
### Quick Install (synthesis environment)
 
```powershell
.\scripts\install\install_synthesis.ps1
```
 
This creates the `synth_eye_gan` conda environment, downloads all pretrained model weights (`front.pkl`, `fingerprint.pkl`, `back.pkl`) into `models/`, and runs an import smoke test.
 
### Manual Install
 
```bash
conda env create -f envs/environment.yml
conda activate synth_eye_gan
```
 
```bash
# Download all three model weights into models/
python src/Hub/HuggingFace.py download --output-dir models
 
# Download specific weights only (e.g. front and fingerprint):
python src/Hub/HuggingFace.py download --models front fingerprint --output-dir models
```
 
Expected layout after download:
 
```
models/
├── front.pkl
├── fingerprint.pkl
└── back.pkl
```
 
For full manual installation steps, see [src/Synthesis/README.md](src/Synthesis/README.md).
 
### UI / App Environment
 
A separate environment is used for the PyQt5 inspection application:
 
```powershell
.\scripts\install\install_app.ps1
```
 
---
 
## Usage
 
This section provides a high-level overview of the three main stages. Detailed instructions for each stage are in the dedicated documentation linked below.
 
> For full parameter reference and step-by-step setup of the **synthesis pipeline**, see  
> 📄 [src/Synthesis/README.md](src/Synthesis/README.md)
 
> For the underlying **StyleGAN2-ADA** framework documentation, clone the separate repository:  
> 📄 [LukasMoravansky/stylegan2-ada-pytorch](https://github.com/LukasMoravansky/stylegan2-ada-pytorch)
 
---
 
### Stage 1 — Synthetic Data Generation
 
Generate composite fingerprint-on-object images using two pretrained StyleGAN2-ADA models:
 
**Prerequisites for this stage:**
 
```bash
# Clone the StyleGAN2-ADA fork into vendor/ (required for GAN inference)
git clone https://github.com/LukasMoravansky/stylegan2-ada-pytorch vendor/stylegan2-ada-pytorch
 
conda activate synth_eye_gan
```
 
```powershell
python src\Synthesis\Pipeline.py composite `
  --count 100 `
  --front-model models\front.pkl `
  --fingerprint-model models\fingerprint.pkl `
  --annotate `
  --auto-split
```
 
When `--annotate` is set, `--output-dir` is ignored — images and YOLO labels are written to `Data/Dataset_v1/images/<partition>/` and `Data/Dataset_v1/labels/<partition>/` respectively. See [src/Synthesis/README.md](src/Synthesis/README.md) for the full parameter reference.
 
**Example outputs:**
 
<p align="center">
  <img src="images/example_0.png" width="150" alt="example 0">
  <img src="images/example_1.png" width="150" alt="example 1">
  <img src="images/example_2.png" width="150" alt="example 2">
</p>
---
 
### Compositing — Blend Mode Examples
 
The compositor supports three blend modes. Each mode controls how the fingerprint is merged onto the object surface:
 
| Mode | Behaviour |
|------|-----------|
| `alpha` | Standard over-compositing; fingerprint sits on top of object |
| `multiply` | Fingerprint RGB multiplied with object RGB; print darkens the surface |
| `overlay` | Contrast-boosting blend; preserves object texture under the print |
 
**alpha:**
![blend-mode-alpha](images/Fingerprint/blend-mode-alpha.png)
 
**multiply:**
![blend-mode-multiply](images/Fingerprint/blend-mode-multiply.png)
 
**overlay:**
![blend-mode-overlay](images/Fingerprint/blend-mode-overlay.png)
 
> Full parameter reference for compositing and image generation (feathering, pressure simulation, motion blur, opacity, color, annotation) is in the dedicated synthesis documentation: [src/Synthesis/README.md](src/Synthesis/README.md).
 
---
 
### Stage 2 — Model Training
 
Train YOLO models on the generated dataset:
 
```bash
conda activate synth_eye_app
cd Training
python train.py
```
 
Update the dataset path in `Training/Args_Model_1.yaml` before running. The script auto-selects GPU if available and writes results to `YOLO/Results/`.
 
---
 
### Stage 3 — Real-Time Inspection (UI)
 
Launch the desktop application for live camera-based inspection:
 
```bash
conda activate synth_eye_app
python App/run.py
```
 
Connect a Basler camera before starting. The UI loads YOLO models from `YOLO/` and displays live detection results with bounding boxes, a productivity graph, and a timestamped system logger.
 
#### Object Measurement
 
The inspection workflow follows three sequential steps triggered by dedicated buttons: **CAPTURE** acquires and undistorts a frame from the Basler camera; **ANALYSE** runs YOLO object detection to classify the part's orientation (front or back side); **MEASURE** becomes active after a successful capture or analysis and runs the dimension measurement pipeline (`src/Measurement/Core.py`) on the clean, pre-annotation image.
 
The pipeline measures five properties of the industrial part and validates them against calibrated reference values:
 
| Measured dimension | Reference value | Tolerance |
|--------------------|----------------|-----------|
| Height | 60.0 mm | ±3.0 mm |
| Width | 40.0 mm | ±3.0 mm |
| Hole diameter | 6.0 mm | ±3.0 mm |
| Hole centre distance | 25.0 mm | ±3.0 mm |
| Rotation angle | — | — |
 
The part receives a **PASS** result if all four dimensional checks are within tolerance, or **FAIL** if any one exceeds it. The annotated result image (bounding box in orange for PASS, red for FAIL; hole circles and centre-to-centre line drawn) is displayed in the camera view, and all five measured values are written to the timestamped system logger.
 
**Front-side measurement** (`Cls_Obj_Front_Side`, `object_id = 0`):
 
The YOLO object detection model classifies the part as front-side (class 0). The measurement pipeline segments the green background via HSV thresholds, inverts the mask to isolate the part body, then applies **Hough circle detection** on the binary holes mask to locate holes precisely. The measured inner hole diameter is stored as `Hole_Diameter_Front`. An additional pass searches for the outer counterbore ring around each inner hole using radial-gradient scoring.
 
<p align="center">
  <img src="images/front_measured.png" alt="Front-side measurement result" width="600">
</p>
**Back-side measurement** (`Cls_Obj_Back_Side`, `object_id = 1`):
 
When the part is classified as back-side (class 1), hole detection switches to **contour analysis** (`cv2.minEnclosingCircle`) instead of Hough circles, because back-side holes appear blurrier and less sharply defined. A more lenient diameter filter (0.4×–2.5× the reference diameter) is applied to avoid missed detections. The measured diameter is stored as `Hole_Diameter_Back`.
 
<p align="center">
  <img src="images/back_measured.png" alt="Back-side measurement result" width="600">
</p>
---
 
### GAN-Based Synthetic Data (Synth.Eye GAN)
 
#### Pretrained Models
 
| File | Type | Resolution | Description |
|------|------|------------|-------------|
| `front.pkl` | StyleGAN2-ADA generator | 256×256 px | Generates industrial part front-side images |
| `back.pkl` | StyleGAN2-ADA generator | 256×256 px | Generates industrial part back-side images |
| `fingerprint.pkl` | StyleGAN2-ADA generator | 128×128 px | Generates fingerprint residue images |
| `yolov8m_object_detection` | YOLOv8 Medium | imgsz 640 | Detects part orientation — `Cls_Obj_Front_Side` (0), `Cls_Obj_Back_Side` (1) |
| `yolov8m_defect_detection` | YOLOv8 Medium | imgsz 640 | Detects fingerprint residue defects — `Cls_Defect_Fingerprint` (0) |
 
Models are hosted on [HuggingFace](https://huggingface.co/LukasMoravansky/Synth-Eye-GAN) and downloaded automatically by `scripts/install/install_synthesis.ps1` or `src/Hub/HuggingFace.py`.
 
#### GAN Inference
 
Requires the [StyleGAN2-ADA fork](https://github.com/LukasMoravansky/stylegan2-ada-pytorch) cloned to `vendor/stylegan2-ada-pytorch/` (see Prerequisites above).
 
```python
import pickle
import torch
 
with open("models/front.pkl", "rb") as f:
    G = pickle.load(f)["G_ema"].cuda()
 
z = torch.randn(1, G.z_dim).cuda()
c = torch.zeros(1, G.c_dim).cuda()
img = G(z, c)  # (1, 3, 256, 256), range [-1, 1]
```
 
#### YOLO Inference
 
```python
from ultralytics import YOLO
 
model = YOLO("YOLO/Model/yolov8m_object_detection.pt")
results = model("image.jpg", imgsz=640)
```
 
#### Generate Raw Images (no compositing)
 
**Linux / macOS:**
 
```bash
python src/Synthesis/Generate.py front \
  --model models/front.pkl \
  --count 4 \
  --output-dir images/raw_front
 
python src/Synthesis/Generate.py fingerprint \
  --model models/fingerprint.pkl \
  --count 4 \
  --output-dir images/raw_fingerprint
```
 
**Windows (PowerShell):**
 
```powershell
python src\Synthesis\Generate.py front `
  --model models\front.pkl `
  --count 4 `
  --output-dir images\raw_front
```
 
 
### How to Run the Example
 
The `Example/` directory contains minimal runnable examples for each subsystem:
 
```bash
conda activate synth_eye_gan
 
# Run the dataset example
python Example/Dataset/<example_script>.py
 
# Run a measurement example
python Example/Measurement/<example_script>.py
```
 
Refer to the scripts inside `Example/` for the exact filenames and any required arguments.
 
---
 
## Datasets
 
The training dataset for both YOLO models is available on [HuggingFace Datasets](https://huggingface.co/datasets/LukasMoravansky/Synth-Eye-GAN-Data).
 
### Classes
 
| ID | Name | Description |
|----|------|-------------|
| 0 | `Cls_Obj_Front_Side` | Front-side of the industrial part (no defect) |
| 1 | `Cls_Obj_Back_Side` | Back-side of the industrial part |
| 2 | `Cls_Defect_Fingerprint` | Fingerprint residue composite on the front side |
 
### Splits
 
| Split | Content | Size |
|-------|---------|------|
| `train` | Synthetic GAN images (80 %) | ~4 800 images |
| `val` | Synthetic GAN images (10 %) | ~600 images |
| `test` | Real industrial photos from [JIC](https://www.jic.cz/en/) | varies |
 
Default generation counts: **3 000 back-side** + **1 500 front-side** + **1 500 front+fingerprint composites** = **6 000 synthetic images**.
 
### Format
 
- **Images:** 256×256 px PNG, composited onto a green camera background
- **Labels:** YOLO `.txt` (one box per line: `class cx cy w h`, normalized), mirroring the image directory tree
- **Config:** `data.yaml` (Ultralytics format)
### GAN Training Data Sources
 
| Model | Dataset | Size | Availability |
|-------|---------|------|--------------|
| Front / Back GAN | Proprietary photos from [JIC](https://www.jic.cz/en/) | ~130 images per side | Not public; cropped versions on [HF Datasets](https://huggingface.co/datasets/LukasMoravansky/Synth-Eye-GAN-Data) |
| Fingerprint GAN | [SOCOFing](https://www.kaggle.com/datasets/ruizgara/socofing) | 6 000 scanned fingerprint images | Public (Kaggle) |
| YOLO models | Synthetic composites from Dataset_v2 and Dataset_v3 | See [HF Datasets](https://huggingface.co/datasets/LukasMoravansky/Synth-Eye-GAN-Data) | Public |
 
---
 
## Results
 
<p align="center">
  <img src="images/Image_5.png" alt="Inspection result example" width="600">
</p>
Both YOLO models (`yolov8m_object_detection` and `yolov8m_defect_detection`) were trained entirely on the synthetic composite dataset (no real labeled images in train/val splits). The models are deployed in the PyQt5 application for live industrial inspection.
 
Detailed benchmark results (mAP, training curves) are available in `YOLO/Results/` after training and on the [HuggingFace model card](https://huggingface.co/LukasMoravansky/Synth-Eye-GAN).
 
**Known limitations:**
- Front/Back GANs were trained on ~130 real images per side; output diversity is limited accordingly.
- The fingerprint GAN was trained on scanned ink fingerprints (SOCOFing), which differ visually from optical-camera residue on metal surfaces.
- All models are tuned to a single industrial part type from [JIC](https://www.jic.cz/en/) and are not general-purpose detectors.
---
 
## Contributors
 
<table> <tr> <td align="center"> <a href="https://github.com/rparak"> <img src="https://avatars.githubusercontent.com/rparak" width="120px;" alt="Roman Parak"/><br /> <strong>Roman Parak</strong> </a><br /> </td> <td align="center"> <a href="https://github.com/LukasMoravansky"> <img src="https://avatars.githubusercontent.com/LukasMoravansky" width="120px;" alt="Lukas Moravansky"/><br /> <strong>Lukas Moravansky</strong> </a><br /> </td> <td align="center"> <a href="https://github.com/piifl"> <img src="https://avatars.githubusercontent.com/piifl" width="120px;" alt="Filip Rusnak"/><br /> <strong>Filip Rusnak</strong> </a><br /> </td> </tr> </table>
---
 
## Related Resources
 
| Resource | Link |
|----------|------|
| GitHub — source code | [LukasMoravansky/Synth_Eye_GAN](https://github.com/LukasMoravansky/Synth_Eye_GAN) |
| HuggingFace — pretrained models | [LukasMoravansky/Synth-Eye-GAN](https://huggingface.co/LukasMoravansky/Synth-Eye-GAN) |
| HuggingFace — training dataset | [LukasMoravansky/Synth-Eye-GAN-Data](https://huggingface.co/datasets/LukasMoravansky/Synth-Eye-GAN-Data) |
| StyleGAN2-ADA fork (this project) | [LukasMoravansky/stylegan2-ada-pytorch](https://github.com/LukasMoravansky/stylegan2-ada-pytorch) |
| StyleGAN2-ADA original (NVlabs) | [NVlabs/stylegan2-ada-pytorch](https://github.com/NVlabs/stylegan2-ada-pytorch) |
| Synth.Eye (Blender predecessor) | [rparak/Synth_Eye](https://github.com/rparak/Synth_Eye) |
| SOCOFing fingerprint dataset | [Kaggle: SOCOFing](https://www.kaggle.com/datasets/ruizgara/socofing) |
| JIC | [jic.cz](https://www.jic.cz/en/) |
| Miniconda | [docs.conda.io](https://docs.conda.io/en/latest/miniconda.html) |
| Blender | [blender.org](https://www.blender.org/download/) |
 
---
 
## License
 
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
 
You are free to use, modify, distribute, and sublicense this software, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the software.
 
---
 
## Acknowledgements
 
This project was developed as part of internal research activities at the **[JIC](https://www.jic.cz/en/)**, with a focus on advancing synthetic data generation for **industrial artificial intelligence and machine vision applications**.