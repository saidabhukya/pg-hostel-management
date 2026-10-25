/**
 * Add Student Modal Component
 * Features cascading Floor -> Room -> Bed selector showing ONLY available beds
 */
const AddStudentModal = {
  allAvailableBeds: [],

  async open() {
    await this.renderForm();
  },

  async openWithBed(bedId, roomNumber, bedLabel) {
    await this.renderForm({ bedId, roomNumber, bedLabel });
  },

  async renderForm(preselected = null) {
    try {
      // Fetch available beds
      const res = await API.get('/rooms/options/available');
      this.allAvailableBeds = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);

      if (this.allAvailableBeds.length === 0 && !preselected) {
        Toast.warning('No available beds in the hostel! All 250 beds are currently occupied or under maintenance.');
        return;
      }

      // Always show all 5 floors (1–5) regardless of bed availability
      // so the warden can always see every floor in the dropdown
      const floors = [1, 2, 3, 4, 5];
      const defaultJoiningDate = Utils.getTodayISO();

      const content = `
        <form id="add-student-form" onsubmit="AddStudentModal.handleSubmit(event)" enctype="multipart/form-data">
          <!-- Personal Details -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            1. Student Personal & Academic Details
          </div>

          <!-- Photo Upload -->
          <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.25rem;padding:1rem;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px dashed var(--border-color);">
            <div style="position:relative;cursor:pointer;" onclick="document.getElementById('as-photo-input').click()" title="Click to upload student photo">
              <img
                id="as-photo-preview"
                src="./assets/images/default-student.png"
                alt="Student Photo Preview"
                style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-red-border);display:block;"
              />
              <div style="position:absolute;bottom:0;right:0;background:var(--primary-red);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
                <i data-lucide="camera" style="width:13px;height:13px;color:#fff;"></i>
              </div>
            </div>
            <div style="flex:1;">
              <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-bottom:0.25rem;">Student Photo</div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">JPG, PNG or WEBP · Max 5 MB · Click photo to change</div>
              <input
                type="file"
                id="as-photo-input"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style="display:none;"
                onchange="AddStudentModal.previewPhoto(this)"
              />
              <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('as-photo-input').click()">
                <i data-lucide="upload" style="width:13px;height:13px;"></i>
                Upload Photo
              </button>
              <span id="as-photo-name" style="font-size:0.75rem;color:var(--text-muted);margin-left:0.5rem;">No file chosen</span>
            </div>
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Student Full Name</label>
              <input type="text" id="as-name" class="form-control" placeholder="e.g. Vikramaditya Singh" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Registration / Roll Number</label>
              <input type="text" id="as-regNumber" class="form-control" placeholder="e.g. 2024CS240" required />
              <small style="color:var(--primary-red);font-size:0.72rem;margin-top:2px;display:block;">
                🔑 This will be used as the student's <strong>Username & Password</strong> for portal login.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label required">Phone Number</label>
              <input type="tel" id="as-phone" class="form-control" placeholder="e.g. +91 98765 00000" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Email Address</label>
              <input type="email" id="as-email" class="form-control" placeholder="e.g. student@college.edu" required />
            </div>

            <div class="form-group">
              <label class="form-label required">College / University</label>
              <select id="as-college" class="form-control" onchange="AddStudentModal.onCollegeChange(this.value)" required>
                <option value="" disabled selected>-- Select College / University --</option>
                <optgroup label="Vignan Group of Institutions">
                  <option value="Vignan's Foundation for Science, Technology and Research (Vignan University, Vadlamudi)">Vignan's Foundation for Science, Technology and Research (Vignan University, Vadlamudi)</option>
                  <option value="Vignan's Lara Institute of Technology & Science (Lara, Vadlamudi)">Vignan's Lara Institute of Technology & Science (Lara, Vadlamudi)</option>
                  <option value="Vignan's Nirula Institute of Technology & Science for Women (VNITSW, Guntur)">Vignan's Nirula Institute of Technology & Science for Women (VNITSW, Guntur)</option>
                  <option value="Vignan Pharmacy College (Vadlamudi)">Vignan Pharmacy College (Vadlamudi)</option>
                </optgroup>
                <optgroup label="Regional Universities & Engineering Colleges">
                  <option value="K L Deemed to be University (KLEF, Vaddeswaram)">K L Deemed to be University (KLEF, Vaddeswaram)</option>
                  <option value="Acharya Nagarjuna University (ANU, Nambur)">Acharya Nagarjuna University (ANU, Nambur)</option>
                  <option value="RVR & JC College of Engineering (Chowdavaram)">RVR & JC College of Engineering (Chowdavaram)</option>
                  <option value="Vasireddy Venkatadri Institute of Technology (VVIT, Nambur)">Vasireddy Venkatadri Institute of Technology (VVIT, Nambur)</option>
                  <option value="SRM University AP (Amaravati)">SRM University AP (Amaravati)</option>
                  <option value="VIT-AP University (Amaravati)">VIT-AP University (Amaravati)</option>
                  <option value="Bapatla Engineering College (BEC, Bapatla)">Bapatla Engineering College (BEC, Bapatla)</option>
                </optgroup>
                <option value="Other">Other College / University (Type Manually)</option>
              </select>
              <div id="as-college-other-wrap" style="display:none;margin-top:0.5rem;">
                <input type="text" id="as-college-other" class="form-control" placeholder="Enter Full College / University Name" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">Course / Degree</label>
              <select id="as-course" class="form-control" onchange="AddStudentModal.onCourseChange(this.value)" required>
                <option value="" disabled selected>-- Select Course / Degree --</option>
                <optgroup label="B.Tech (Bachelor of Technology) Programs">
                  <option value="B.Tech - Artificial Intelligence and Machine Learning (CSE - AI & ML)">B.Tech - Artificial Intelligence and Machine Learning (CSE - AI & ML)</option>
                  <option value="B.Tech - Computer Science and Engineering (CSE)">B.Tech - Computer Science and Engineering (CSE)</option>
                  <option value="B.Tech - Information Technology (IT)">B.Tech - Information Technology (IT)</option>
                  <option value="B.Tech - Electronics and Communication Engineering (ECE)">B.Tech - Electronics and Communication Engineering (ECE)</option>
                  <option value="B.Tech - Electrical and Electronics Engineering (EEE)">B.Tech - Electrical and Electronics Engineering (EEE)</option>
                  <option value="B.Tech - Mechanical Engineering (ME)">B.Tech - Mechanical Engineering (ME)</option>
                  <option value="B.Tech - Civil Engineering (CE)">B.Tech - Civil Engineering (CE)</option>
                  <option value="B.Tech - Computer Science and Business Systems (CSBS)">B.Tech - Computer Science and Business Systems (CSBS)</option>
                  <option value="B.Tech - Cyber Security (CSE - Cyber Security)">B.Tech - Cyber Security (CSE - Cyber Security)</option>
                  <option value="B.Tech - Data Science (CSE - Data Science)">B.Tech - Data Science (CSE - Data Science)</option>
                  <option value="B.Tech - Biotechnology (BT)">B.Tech - Biotechnology (BT)</option>
                  <option value="B.Tech - Biomedical Engineering (BME)">B.Tech - Biomedical Engineering (BME)</option>
                  <option value="B.Tech - Food Technology (FT)">B.Tech - Food Technology (FT)</option>
                  <option value="B.Tech - Agricultural Engineering (Agri)">B.Tech - Agricultural Engineering (Agri)</option>
                  <option value="B.Tech - Chemical Engineering (Chem)">B.Tech - Chemical Engineering (Chem)</option>
                  <option value="B.Tech - Robotics and Automation (RA)">B.Tech - Robotics and Automation (RA)</option>
                  <option value="B.Tech - Automobile Engineering">B.Tech - Automobile Engineering</option>
                  <option value="B.Tech - Textile Technology (TT)">B.Tech - Textile Technology (TT)</option>
                </optgroup>
                <optgroup label="Pharmacy Programs">
                  <option value="B.Pharm - Bachelor of Pharmacy">B.Pharm - Bachelor of Pharmacy</option>
                  <option value="Pharm.D - Doctor of Pharmacy">Pharm.D - Doctor of Pharmacy</option>
                  <option value="M.Pharm - Master of Pharmacy">M.Pharm - Master of Pharmacy</option>
                </optgroup>
                <optgroup label="Management, Applications & Postgraduate">
                  <option value="BBA - Bachelor of Business Administration">BBA - Bachelor of Business Administration</option>
                  <option value="BCA - Bachelor of Computer Applications">BCA - Bachelor of Computer Applications</option>
                  <option value="B.Sc - Bachelor of Science">B.Sc - Bachelor of Science</option>
                  <option value="MCA - Master of Computer Applications">MCA - Master of Computer Applications</option>
                  <option value="MBA - Master of Business Administration">MBA - Master of Business Administration</option>
                  <option value="M.Tech - Master of Technology">M.Tech - Master of Technology</option>
                </optgroup>
                <option value="Other">Other Course / Degree (Type Manually)</option>
              </select>
              <div id="as-course-other-wrap" style="display:none;margin-top:0.5rem;">
                <input type="text" id="as-course-other" class="form-control" placeholder="Enter Full Course / Degree Name" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Academic Year</label>
              <select id="as-year" class="form-control">
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year" selected>3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="as-gender" class="form-control">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <!-- Parent / Guardian Details -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            2. Parent / Guardian Contact
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Parent / Guardian Name</label>
              <input type="text" id="as-parentName" class="form-control" placeholder="Father or Mother's Name" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Parent Phone</label>
              <input type="tel" id="as-parentPhone" class="form-control" placeholder="Parent contact number" required />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Permanent Address</label>
              <input type="text" id="as-address" class="form-control" placeholder="House no, street, city, pin code" value="Sector 15, Rohini, New Delhi - 110085" />
            </div>
          </div>

          <!-- Room Allocation & Joining-Date Fee (CRITICAL) -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            3. Room Allocation & Joining-Date Fee Cycle
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Joining Date</label>
              <input type="date" id="as-joiningDate" class="form-control" value="${defaultJoiningDate}" required onchange="AddStudentModal.updateCyclePreview()" />
              <small style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;">
                Fee cycle is calculated strictly from this joining date.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label required">Monthly Fee (₹)</label>
              <input type="number" id="as-monthlyFee" class="form-control" value="7000" min="1000" step="100" required onchange="AddStudentModal.updateCyclePreview()" />
            </div>

            <div class="form-group">
              <label class="form-label required">Fee Payment Status at Admission</label>
              <select id="as-paymentStatus" class="form-control" onchange="AddStudentModal.onPaymentStatusChange(this.value)">
                <option value="pending" selected>Pending (Collect fee later - Default)</option>
                <option value="paid">Paid Now (Fee received at admission desk)</option>
              </select>
            </div>

            <div class="form-group" id="as-paymentMethod-wrap" style="display:none;">
              <label class="form-label required">Payment Mode</label>
              <select id="as-paymentMethod" class="form-control">
                <option value="UPI (PhonePe / Google Pay)">UPI (PhonePe / Google Pay / Paytm)</option>
                <option value="Cash at Desk">Cash at Reception Desk</option>
                <option value="Bank NetBanking">Bank Transfer / IMPS / NEFT</option>
                <option value="Debit / Credit Card">Debit / Credit Card</option>
              </select>
            </div>

            <!-- CASCADING SELECTORS: Floor -> Room -> Bed -->
            <div class="form-group">
              <label class="form-label required">Select Floor</label>
              <select id="as-floor" class="form-control" required onchange="AddStudentModal.onFloorChange(this.value)">
                <option value="">-- Choose Floor (1 to 5) --</option>
                ${floors.map(f => {
                  const suffix = f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th';
                  const roomStart = (f * 100) + 1;
                  const roomEnd  = (f * 100) + 10;
                  const bedsOnFloor = this.allAvailableBeds.filter(b => b.floor_number === f).length;
                  const tag = bedsOnFloor === 0 ? ' — No Beds Available' : ` — ${bedsOnFloor} Bed${bedsOnFloor > 1 ? 's' : ''} Free`;
                  return `<option value="${f}">${f}${suffix} Floor (Rooms ${roomStart}–${roomEnd})${tag}</option>`;
                }).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Select Room</label>
              <select id="as-room" class="form-control" required onchange="AddStudentModal.onRoomChange(this.value)" disabled>
                <option value="">-- Select Floor First --</option>
              </select>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label required">Select Available Bed</label>
              <select id="as-bed" class="form-control" required disabled>
                <option value="">-- Select Room First --</option>
              </select>
            </div>
          </div>

          <!-- Calculated Billing Cycle Preview Box -->
          <div id="as-cycle-preview" style="background:var(--bg-secondary);border:1px dashed var(--primary-red-border);border-radius:var(--radius-md);padding:0.85rem 1rem;margin-bottom:1.25rem;font-size:0.84rem;color:var(--text-secondary);">
            <strong>Initial Billing Cycle Preview:</strong>
            <div id="as-cycle-preview-text" style="margin-top:0.25rem;color:var(--primary-red);font-weight:700;">
              Select joining date to preview cycle...
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.75rem;padding-top:1rem;border-top:1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="as-submit-btn" class="btn btn-primary">
              <i data-lucide="check-circle" style="width:16px;height:16px;"></i>
              <span>Enroll Student & Allocate Bed</span>
            </button>
          </div>
        </form>
      `;

      Modal.open({
        title: 'New Student Admission & Bed Allocation',
        content: content,
        maxWidth: '720px'
      });

      this.updateCyclePreview();

      // If preselected bed passed (e.g. from room detail modal)
      if (preselected) {
        const matchingBed = this.allAvailableBeds.find(b => b.bed_id === preselected.bedId);
        if (matchingBed) {
          const floorSelect = document.getElementById('as-floor');
          if (floorSelect) {
            floorSelect.value = matchingBed.floor_number;
            this.onFloorChange(matchingBed.floor_number);
            const roomSelect = document.getElementById('as-room');
            if (roomSelect) {
              roomSelect.value = matchingBed.room_number;
              this.onRoomChange(matchingBed.room_number);
              const bedSelect = document.getElementById('as-bed');
              if (bedSelect) {
                bedSelect.value = matchingBed.bed_id;
              }
            }
          }
        }
      }
    } catch (e) {
      Toast.error('Failed to load admission form: ' + e.message);
    }
  },

  onFloorChange(floorNum) {
    const roomSelect = document.getElementById('as-room');
    const bedSelect = document.getElementById('as-bed');
    if (!roomSelect || !bedSelect) return;

    if (!floorNum) {
      roomSelect.innerHTML = '<option value="">-- Select Floor First --</option>';
      roomSelect.disabled = true;
      bedSelect.innerHTML = '<option value="">-- Select Room First --</option>';
      bedSelect.disabled = true;
      return;
    }

    // Filter available rooms on this floor
    const bedsOnFloor = this.allAvailableBeds.filter(b => b.floor_number === Number(floorNum));
    const uniqueRooms = [...new Set(bedsOnFloor.map(b => b.room_number))].sort();

    if (uniqueRooms.length === 0) {
      // Floor exists but all its beds are occupied/maintenance
      roomSelect.innerHTML = '<option value="">— No available rooms on this floor —</option>';
      roomSelect.disabled = true;
      bedSelect.innerHTML = '<option value="">— No available beds —</option>';
      bedSelect.disabled = true;
      Toast.info(`Floor ${floorNum} has no available beds. Please choose another floor.`);
      return;
    }

    roomSelect.innerHTML = '<option value="">-- Choose Room --</option>' +
      uniqueRooms.map(rm => `<option value="${rm}">Room ${rm}</option>`).join('');
    roomSelect.disabled = false;

    bedSelect.innerHTML = '<option value="">-- Choose Room First --</option>';
    bedSelect.disabled = true;
  },

  onRoomChange(roomNum) {
    const bedSelect = document.getElementById('as-bed');
    if (!bedSelect) return;

    if (!roomNum) {
      bedSelect.innerHTML = '<option value="">-- Select Room First --</option>';
      bedSelect.disabled = true;
      return;
    }

    // Filter available beds in this room
    const bedsInRoom = this.allAvailableBeds.filter(b => b.room_number === roomNum);

    bedSelect.innerHTML = '<option value="">-- Choose Available Bed --</option>' +
      bedsInRoom.map(b => `<option value="${b.bed_id}">${b.bed_label} (Available)</option>`).join('');
    bedSelect.disabled = false;
  },

  updateCyclePreview() {
    const dateInput = document.getElementById('as-joiningDate');
    const feeInput = document.getElementById('as-monthlyFee');
    const previewEl = document.getElementById('as-cycle-preview-text');
    if (!dateInput || !previewEl) return;

    const joiningDate = dateInput.value;
    const fee = feeInput ? feeInput.value : 7000;

    if (!joiningDate) {
      previewEl.innerText = 'Please select joining date.';
      return;
    }

    try {
      // Calculate Cycle 1
      const d = new Date(joiningDate);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const cycleEnd = new Date(nextMonth.getTime() - (24 * 60 * 60 * 1000));

      const formatD = (dt) => {
        const day = String(dt.getDate()).padStart(2, '0');
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        return `${day}-${m}-${dt.getFullYear()}`;
      };

      previewEl.innerText = `Cycle 1: ${formatD(d)} → ${formatD(cycleEnd)} (Due: ${formatD(cycleEnd)} • ₹${Number(fee).toLocaleString('en-IN')})`;
    } catch (e) {
      previewEl.innerText = 'Calculating...';
    }
  },

  /** Live preview when user picks a photo file */
  previewPhoto(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    // Validate size client-side (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('Photo must be under 5 MB.');
      input.value = '';
      return;
    }

    const preview = document.getElementById('as-photo-preview');
    const nameEl  = document.getElementById('as-photo-name');
    if (preview) {
      const reader = new FileReader();
      reader.onload = (e) => { preview.src = e.target.result; };
      reader.readAsDataURL(file);
    }
    if (nameEl) nameEl.textContent = file.name;
  },

  onCollegeChange(val) {
    const wrap = document.getElementById('as-college-other-wrap');
    const input = document.getElementById('as-college-other');
    if (wrap) {
      if (val === 'Other') {
        wrap.style.display = 'block';
        if (input) input.focus();
      } else {
        wrap.style.display = 'none';
      }
    }
  },

  onPaymentStatusChange(val) {
    const wrap = document.getElementById('as-paymentMethod-wrap');
    if (wrap) {
      wrap.style.display = val === 'paid' ? 'block' : 'none';
    }
  },

  onCourseChange(val) {
    const wrap = document.getElementById('as-course-other-wrap');
    const input = document.getElementById('as-course-other');
    if (wrap) {
      if (val === 'Other') {
        wrap.style.display = 'block';
        if (input) input.focus();
      } else {
        wrap.style.display = 'none';
      }
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('as-submit-btn');

    const name       = document.getElementById('as-name').value.trim();
    const regNumber  = document.getElementById('as-regNumber').value.trim();
    const phone      = document.getElementById('as-phone').value.trim();
    const email      = document.getElementById('as-email').value.trim();

    const collegeSelect = document.getElementById('as-college');
    const collegeOther  = document.getElementById('as-college-other');
    let college = collegeSelect ? collegeSelect.value : '';
    if (college === 'Other' && collegeOther && collegeOther.value.trim()) {
      college = collegeOther.value.trim();
    }

    const courseSelect  = document.getElementById('as-course');
    const courseOther   = document.getElementById('as-course-other');
    let course = courseSelect ? courseSelect.value : '';
    if (course === 'Other' && courseOther && courseOther.value.trim()) {
      course = courseOther.value.trim();
    }

    const year       = document.getElementById('as-year').value;
    const gender     = document.getElementById('as-gender').value;
    const parentName  = document.getElementById('as-parentName').value.trim();
    const parentPhone = document.getElementById('as-parentPhone').value.trim();
    const address    = document.getElementById('as-address').value.trim();
    const joiningDate = document.getElementById('as-joiningDate').value;
    const monthlyFee = document.getElementById('as-monthlyFee').value;
    const bedId      = document.getElementById('as-bed').value;
    const photoInput = document.getElementById('as-photo-input');

    if (!college) {
      Toast.error('Please select or enter the Student College / University.');
      return;
    }
    if (!course) {
      Toast.error('Please select or enter the Student Course / Degree.');
      return;
    }

    if (!bedId) {
      Toast.error('Please select an available bed for the student.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
      }

      // Build FormData so the photo file is sent as multipart upload
      const fd = new FormData();
      fd.append('name',        name);
      fd.append('regNumber',   regNumber);
      fd.append('phone',       phone);
      fd.append('email',       email);
      fd.append('college',     college);
      fd.append('course',      course);
      fd.append('year',        year);
      fd.append('gender',      gender);
      fd.append('parentName',  parentName);
      fd.append('parentPhone', parentPhone);
      fd.append('address',     address);
      fd.append('joiningDate', joiningDate);
      fd.append('monthlyFee',  monthlyFee);
      fd.append('bedId',       bedId);

      const paymentStatusEl = document.getElementById('as-paymentStatus');
      const paymentMethodEl = document.getElementById('as-paymentMethod');
      fd.append('paymentStatus', paymentStatusEl ? paymentStatusEl.value : 'pending');
      fd.append('paymentMethod', paymentMethodEl ? paymentMethodEl.value : 'Cash at Desk');
      if (photoInput && photoInput.files && photoInput.files[0]) {
        fd.append('photo', photoInput.files[0]);
      }

      // Use FormData variant (API.post detects FormData and skips JSON.stringify)
      const res = await API.post('/students', fd);

      if (res.success) {
        Modal.close();

        // Show login credentials info popup
        const regNum = regNumber.trim();
        Modal.open({
          title: '✅ Student Enrolled Successfully!',
          content: `
            <div style="text-align:center;padding:0.5rem 0;">
              <div style="font-size:2.5rem;margin-bottom:0.75rem;">🎉</div>
              <p style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:1.25rem;">${res.message}</p>
              <div style="background:var(--bg-secondary);border:2px solid var(--primary-red-border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1rem;text-align:left;">
                <div style="font-size:0.78rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">🔑 Student Portal Login Credentials</div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:var(--bg-app);border-radius:var(--radius-sm);">
                    <span style="font-size:0.85rem;color:var(--text-secondary);">Username</span>
                    <code style="font-size:0.9rem;font-weight:700;color:var(--primary-red);background:var(--primary-red-light);padding:2px 8px;border-radius:4px;">${regNum}</code>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:var(--bg-app);border-radius:var(--radius-sm);">
                    <span style="font-size:0.85rem;color:var(--text-secondary);">Password</span>
                    <code style="font-size:0.9rem;font-weight:700;color:var(--primary-red);background:var(--primary-red-light);padding:2px 8px;border-radius:4px;">${regNum}</code>
                  </div>
                </div>
                <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.75rem;">
                  ℹ️ Student can login using their Registration Number as both username and password. They can change password from Settings after login.
                </p>
              </div>
              <button class="btn btn-primary" onclick="Modal.close()" style="width:100%;">
                <i data-lucide="check" style="width:16px;height:16px;"></i> Done
              </button>
            </div>
          `,
          maxWidth: '420px'
        });
        Utils.renderIcons();

        // Refresh views if open
        if (window.StudentsPage && App.currentRoute === 'students') {
          StudentsPage.loadStudents();
        }
        if (window.HostelStructurePage && App.currentRoute === 'hostel-structure') {
          HostelStructurePage.loadStructure();
        }
        if (window.AdminDashboard && App.currentRoute === 'dashboard') {
          AdminDashboard.loadData();
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to add student.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check-circle" style="width:16px;height:16px;"></i> <span>Enroll Student & Allocate Bed</span>`;
        Utils.renderIcons();
      }
    }
  }
};

window.AddStudentModal = AddStudentModal;
