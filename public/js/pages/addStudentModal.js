/**
 * Add Student Modal Component
 * Features cascading Floor -> Room -> Bed selector showing available beds,
 * custom login credentials configuration (Username & Password) for online portal access,
 * and joining-date based fee cycles.
 */
const AddStudentModal = {
  allAvailableBeds: [],

  async open() {
    await this.renderForm();
  },

  async openWithBed(bedId, roomNumber, bedLabel) {
    await this.renderForm({ bedId, roomNumber, bedLabel });
  },

  generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pwd = 'Pg@';
    for (let i = 0; i < 5; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const pwdInput = document.getElementById('as-password');
    if (pwdInput) pwdInput.value = pwd;
    Toast.info(`Generated password: ${pwd}`);
  },

  useRegNumberAsPassword() {
    const regInput = document.getElementById('as-regNumber');
    const pwdInput = document.getElementById('as-password');
    const regVal = regInput ? regInput.value.trim() : '';
    if (regVal && pwdInput) {
      pwdInput.value = regVal;
      Toast.info(`Password set to Registration Number: ${regVal}`);
    } else {
      Toast.warning('Please enter Registration Number first.');
    }
  },

  syncUsername(regVal) {
    const uInput = document.getElementById('as-username');
    if (uInput && (!uInput.dataset.manual || uInput.dataset.manual === 'false')) {
      uInput.value = regVal.trim();
    }
    const pwdInput = document.getElementById('as-password');
    if (pwdInput && !pwdInput.value) {
      pwdInput.value = regVal.trim();
    }
  },

  async renderForm(preselected = null) {
    try {
      let beds = [];
      try {
        const res = await API.get('/rooms/options/available');
        beds = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch (apiErr) {
        console.warn('API /rooms/options/available fetch error:', apiErr);
      }

      if (beds.length === 0 && typeof MockData !== 'undefined' && Array.isArray(MockData.availableBeds)) {
        beds = MockData.availableBeds;
      }
      this.allAvailableBeds = beds;

      if (this.allAvailableBeds.length === 0 && !preselected) {
        Toast.warning('No available beds in the hostel! All 250 beds are currently occupied or under maintenance.');
        return;
      }

      const floors = [1, 2, 3, 4, 5];
      const defaultJoiningDate = Utils.getTodayISO();

      const content = `
        <form id="add-student-form" onsubmit="AddStudentModal.handleSubmit(event)" enctype="multipart/form-data">
          <!-- 1. Personal & Academic Details -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            1. Student Personal & Academic Details
          </div>

          <!-- Photo Upload (Optional) -->
          <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.25rem;padding:1rem;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px dashed var(--border-color);">
            <div style="position:relative;cursor:pointer;" onclick="document.getElementById('as-photo-input').click()" title="Click to upload student photo (Optional)">
              <img
                id="as-photo-preview"
                src="./assets/images/default-student.png"
                alt="Student Photo Preview"
                style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-red-border);display:block;background:#fff;"
              />
              <div style="position:absolute;bottom:0;right:0;background:var(--primary-red);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                <i data-lucide="camera" style="width:14px;height:14px;color:#fff;"></i>
              </div>
            </div>
            <div style="flex:1;">
              <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-bottom:0.25rem;display:flex;align-items:center;gap:0.5rem;">
                <span>Student Photo</span>
                <span class="badge" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-muted);font-size:0.7rem;font-weight:600;padding:1px 6px;">Optional</span>
              </div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">JPG, PNG or WEBP · Max 5 MB. If omitted, default profile avatar will be used.</div>
              <input
                type="file"
                id="as-photo-input"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style="display:none;"
                onchange="AddStudentModal.previewPhoto(this)"
              />
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('as-photo-input').click()">
                  <i data-lucide="upload" style="width:13px;height:13px;"></i>
                  Choose Photo
                </button>
                <button type="button" id="as-photo-clear-btn" class="btn btn-sm btn-secondary" style="display:none;color:var(--primary-red);" onclick="AddStudentModal.clearPhoto()">
                  <i data-lucide="x" style="width:13px;height:13px;"></i>
                  Remove
                </button>
                <span id="as-photo-name" style="font-size:0.75rem;color:var(--text-muted);">No file chosen (default avatar)</span>
              </div>
            </div>
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Student Full Name</label>
              <input type="text" id="as-name" class="form-control" placeholder="e.g. Test Student" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Registration / Roll Number</label>
              <input 
                type="text" 
                id="as-regNumber" 
                class="form-control" 
                placeholder="e.g. TEST001" 
                required 
                oninput="AddStudentModal.syncUsername(this.value)"
              />
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
                  <option value="VIGNAN UNIVERSITY">VIGNAN UNIVERSITY</option>
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
                </optgroup>
                <option value="Other">Other College / University</option>
              </select>
              <div id="as-college-other-wrap" style="display:none;margin-top:0.5rem;">
                <input type="text" id="as-college-other" class="form-control" placeholder="Enter Full College / University Name" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">Course / Degree</label>
              <select id="as-course" class="form-control" onchange="AddStudentModal.onCourseChange(this.value)" required>
                <option value="" disabled selected>-- Select Course / Degree --</option>
                <option value="B.Tech Computer Science and Engineering (CSE)">B.Tech Computer Science and Engineering (CSE)</option>
                <option value="B.Tech Information Technology (IT)">B.Tech Information Technology (IT)</option>
                <option value="B.Tech Artificial Intelligence & ML (AI&ML)">B.Tech Artificial Intelligence & ML (AI&ML)</option>
                <option value="B.Tech Electronics & Communication (ECE)">B.Tech Electronics & Communication (ECE)</option>
                <option value="B.Tech Mechanical Engineering (ME)">B.Tech Mechanical Engineering (ME)</option>
                <option value="B.Pharm / M.Pharm">B.Pharm / M.Pharm</option>
                <option value="MBA / MCA">MBA / MCA</option>
                <option value="Other">Other Program</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Academic Year</label>
              <select id="as-year" class="form-control" required>
                <option value="1st Year" selected>1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Gender</label>
              <select id="as-gender" class="form-control" required>
                <option value="Male" selected>Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <!-- 2. PORTAL LOGIN CREDENTIALS -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            2. Student Online Portal Login Credentials
          </div>

          <div style="background:var(--bg-secondary);padding:1rem;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:1.25rem;">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">Login Username / ID</label>
                <input 
                  type="text" 
                  id="as-username" 
                  class="form-control" 
                  placeholder="e.g. TEST001" 
                  oninput="this.dataset.manual = 'true'"
                  required 
                />
                <small style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;display:block;">
                  Student will enter this username to login from their phone.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label required">Login Password</label>
                <div style="display:flex;gap:6px;">
                  <input 
                    type="text" 
                    id="as-password" 
                    class="form-control" 
                    placeholder="e.g. Test@123" 
                    required 
                  />
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AddStudentModal.generateRandomPassword()" title="Generate Random Password">
                    <i data-lucide="key" style="width:13px;height:13px;"></i> Gen
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AddStudentModal.useRegNumberAsPassword()" title="Set to Reg Number">
                    RegNo
                  </button>
                </div>
                <small style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;display:block;">
                  Set a custom password or click Gen for a strong password.
                </small>
              </div>
            </div>
          </div>

          <!-- 3. Family & Emergency Contacts -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            3. Family & Emergency Contacts
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Father / Guardian Name</label>
              <input type="text" id="as-parentName" class="form-control" placeholder="e.g. Rajesh Singh" required />
            </div>

            <div class="form-group">
              <label class="form-label required">Father / Guardian Phone</label>
              <input type="tel" id="as-parentPhone" class="form-control" placeholder="e.g. +91 98765 11111" required />
            </div>

            <div class="form-group">
              <label class="form-label">Mother Name</label>
              <input type="text" id="as-motherName" class="form-control" placeholder="e.g. Sunita Devi" />
            </div>

            <div class="form-group">
              <label class="form-label">Mother Phone</label>
              <input type="tel" id="as-motherPhone" class="form-control" placeholder="e.g. +91 98765 22222" />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Permanent Address</label>
              <input type="text" id="as-address" class="form-control" placeholder="House no, street, city, state, pin code" value="Near College Campus, Guntur - 522002" />
            </div>
          </div>

          <!-- 4. Room Allocation & Joining-Date Fee Cycle -->
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
            4. Room Allocation & Joining-Date Fee Cycle
          </div>

          <div class="form-grid" style="margin-bottom:1.25rem;">
            <div class="form-group">
              <label class="form-label required">Joining Date</label>
              <input type="date" id="as-joiningDate" class="form-control" value="${defaultJoiningDate}" required onchange="AddStudentModal.updateCyclePreview()" />
              <small style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;">
                Monthly billing cycle is calculated from this date.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label required">Monthly Fee (₹)</label>
              <input type="number" id="as-monthlyFee" class="form-control" value="7000" min="1000" step="100" required onchange="AddStudentModal.updateCyclePreview()" />
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
              <label class="form-label required">Select Bed</label>
              <select id="as-bed" class="form-control" required disabled>
                <option value="">-- Select Room First --</option>
              </select>
            </div>
          </div>

          <!-- SUBMIT ACTIONS -->
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;padding-top:1rem;border-top:1px solid var(--border-color);margin-top:1rem;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="as-submit-btn" class="btn btn-primary" style="padding:0.6rem 1.5rem;">
              <i data-lucide="check-circle" style="width:16px;height:16px;"></i>
              <span>Enroll Student & Allocate Bed</span>
            </button>
          </div>
        </form>
      `;

      Modal.open({
        title: 'Enroll New Student & Allocate Bed',
        content,
        maxWidth: '720px'
      });

      if (preselected && preselected.bedId) {
        this.applyPreselectedBed(preselected);
      }
    } catch (err) {
      console.error('[AddStudentModal Error]', err);
      Toast.error('Failed to load bed availability: ' + err.message);
    }
  },

  onFloorChange(floorNum) {
    const roomSelect = document.getElementById('as-room');
    const bedSelect = document.getElementById('as-bed');
    if (!roomSelect || !bedSelect) return;

    roomSelect.innerHTML = '<option value="">-- Choose Room --</option>';
    bedSelect.innerHTML = '<option value="">-- Select Room First --</option>';
    bedSelect.disabled = true;

    if (!floorNum) {
      roomSelect.disabled = true;
      return;
    }

    const floorInt = parseInt(floorNum, 10);
    const roomsOnFloor = [];
    for (let r = 1; r <= 10; r++) {
      roomsOnFloor.push(`${floorInt}${String(r).padStart(2, '0')}`);
    }

    roomsOnFloor.forEach(rNum => {
      const freeBeds = this.allAvailableBeds.filter(b => b.room_number === rNum);
      const opt = document.createElement('option');
      opt.value = rNum;
      opt.textContent = `Room ${rNum} (${freeBeds.length} bed${freeBeds.length !== 1 ? 's' : ''} available)`;
      if (freeBeds.length === 0) opt.disabled = true;
      roomSelect.appendChild(opt);
    });

    roomSelect.disabled = false;
  },

  onRoomChange(roomNum) {
    const bedSelect = document.getElementById('as-bed');
    if (!bedSelect) return;

    bedSelect.innerHTML = '<option value="">-- Choose Bed --</option>';
    if (!roomNum) {
      bedSelect.disabled = true;
      return;
    }

    const availableBeds = this.allAvailableBeds.filter(b => b.room_number === roomNum);
    availableBeds.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.bed_id;
      opt.textContent = `${b.bed_label} (Bed #${b.bed_number}) - Available`;
      bedSelect.appendChild(opt);
    });

    bedSelect.disabled = false;
  },

  applyPreselectedBed(pre) {
    const selectedBed = this.allAvailableBeds.find(b => String(b.bed_id) === String(pre.bedId));
    if (selectedBed) {
      const floorSelect = document.getElementById('as-floor');
      if (floorSelect) {
        floorSelect.value = selectedBed.floor_number;
        this.onFloorChange(selectedBed.floor_number);
        const roomSelect = document.getElementById('as-room');
        if (roomSelect) {
          roomSelect.value = selectedBed.room_number;
          this.onRoomChange(selectedBed.room_number);
          const bedSelect = document.getElementById('as-bed');
          if (bedSelect) bedSelect.value = selectedBed.bed_id;
        }
      }
    }
  },

  onCollegeChange(val) {
    const otherWrap = document.getElementById('as-college-other-wrap');
    if (otherWrap) otherWrap.style.display = val === 'Other' ? 'block' : 'none';
  },

  onCourseChange(val) {},
  updateCyclePreview() {},

  previewPhoto(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const preview = document.getElementById('as-photo-preview');
      const nameEl = document.getElementById('as-photo-name');
      const clearBtn = document.getElementById('as-photo-clear-btn');
      if (nameEl) nameEl.textContent = file.name;
      if (clearBtn) clearBtn.style.display = 'inline-flex';
      const reader = new FileReader();
      reader.onload = e => {
        if (preview) preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
      Utils.renderIcons();
    }
  },

  clearPhoto() {
    const input = document.getElementById('as-photo-input');
    if (input) input.value = '';
    const preview = document.getElementById('as-photo-preview');
    if (preview) preview.src = './assets/images/default-student.png';
    const nameEl = document.getElementById('as-photo-name');
    if (nameEl) nameEl.textContent = 'No file chosen (default avatar)';
    const clearBtn = document.getElementById('as-photo-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
  },

  copyCredentials(user, pass) {
    const text = `SRI RAM PG - Student Login Credentials\nUsername: ${user}\nPassword: ${pass}\nPortal: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Toast.success('Credentials copied to clipboard!');
    } else {
      prompt('Copy credentials:', text);
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('as-submit-btn');

    const name = document.getElementById('as-name')?.value.trim();
    const regNumber = document.getElementById('as-regNumber')?.value.trim();
    const username = document.getElementById('as-username')?.value.trim() || regNumber;
    const password = document.getElementById('as-password')?.value.trim() || regNumber;
    const phone = document.getElementById('as-phone')?.value.trim();
    const email = document.getElementById('as-email')?.value.trim();
    let college = document.getElementById('as-college')?.value;
    if (college === 'Other') {
      college = document.getElementById('as-college-other')?.value.trim() || 'Other College';
    }
    const course = document.getElementById('as-course')?.value;
    const year = document.getElementById('as-year')?.value;
    const gender = document.getElementById('as-gender')?.value;
    const parentName = document.getElementById('as-parentName')?.value.trim();
    const parentPhone = document.getElementById('as-parentPhone')?.value.trim();
    const motherName = document.getElementById('as-motherName')?.value.trim();
    const motherPhone = document.getElementById('as-motherPhone')?.value.trim();
    const address = document.getElementById('as-address')?.value.trim();
    const joiningDate = document.getElementById('as-joiningDate')?.value;
    const monthlyFee = document.getElementById('as-monthlyFee')?.value;
    const bedId = document.getElementById('as-bed')?.value;
    const photoInput = document.getElementById('as-photo-input');

    if (!name || !regNumber || !phone || !email || !bedId || !joiningDate) {
      Toast.error('Please fill in all mandatory fields.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enrolling Student...</span>';
      }

      const fd = new FormData();
      fd.append('name', name);
      fd.append('regNumber', regNumber);
      fd.append('username', username);
      fd.append('password', password);
      fd.append('phone', phone);
      fd.append('email', email);
      fd.append('college', college);
      fd.append('course', course);
      fd.append('year', year);
      fd.append('gender', gender);
      fd.append('parentName', parentName);
      fd.append('parentPhone', parentPhone);
      if (motherName) fd.append('motherName', motherName);
      if (motherPhone) fd.append('motherPhone', motherPhone);
      fd.append('address', address);
      fd.append('joiningDate', joiningDate);
      fd.append('monthlyFee', monthlyFee);
      fd.append('bedId', bedId);

      const bedObj = this.allAvailableBeds.find(b => String(b.bed_id) === String(bedId));
      if (bedObj) {
        fd.append('roomNumber', bedObj.room_number);
        fd.append('floorNumber', bedObj.floor_number);
        fd.append('bedLabel', bedObj.bed_label);
      }

      const previewEl = document.getElementById('as-photo-preview');
      if (previewEl && previewEl.src && previewEl.src.startsWith('data:image')) {
        fd.append('photo_url', previewEl.src);
      }

      if (photoInput && photoInput.files && photoInput.files[0]) {
        fd.append('photo', photoInput.files[0]);
      }

      const res = await API.post('/students', fd);

      if (res.success) {
        Modal.close();

        // Show credentials popup with copy button
        Modal.open({
          title: '✅ Student Enrolled Successfully!',
          content: `
            <div style="text-align:center;padding:0.5rem 0;">
              <div style="font-size:2.5rem;margin-bottom:0.75rem;">🎉</div>
              <p style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:1.25rem;">${res.message}</p>
              
              <div style="background:var(--bg-secondary);border:2px solid var(--primary-red-border);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1.25rem;text-align:left;">
                <div style="font-size:0.78rem;font-weight:700;color:var(--primary-red);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">
                  🔑 Registered Student Portal Credentials
                </div>
                
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:var(--bg-app);border-radius:var(--radius-sm);">
                    <span style="font-size:0.85rem;color:var(--text-secondary);">Student Name</span>
                    <strong style="font-size:0.9rem;color:var(--text-primary);">${Utils.escapeHTML(name)}</strong>
                  </div>
                  
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:var(--bg-app);border-radius:var(--radius-sm);">
                    <span style="font-size:0.85rem;color:var(--text-secondary);">Portal Username</span>
                    <code style="font-size:0.95rem;font-weight:800;color:var(--primary-red);background:var(--primary-red-light);padding:2px 10px;border-radius:4px;">${Utils.escapeHTML(username)}</code>
                  </div>
                  
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:var(--bg-app);border-radius:var(--radius-sm);">
                    <span style="font-size:0.85rem;color:var(--text-secondary);">Portal Password</span>
                    <code style="font-size:0.95rem;font-weight:800;color:var(--primary-red);background:var(--primary-red-light);padding:2px 10px;border-radius:4px;">${Utils.escapeHTML(password)}</code>
                  </div>
                </div>

                <div style="margin-top:0.85rem;display:flex;justify-content:center;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AddStudentModal.copyCredentials('${Utils.escapeHTML(username)}', '${Utils.escapeHTML(password)}')">
                    <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Credentials
                  </button>
                </div>

                <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.85rem;text-align:center;">
                  📱 The student can immediately open the public website from their phone and login using these credentials.
                </p>
              </div>

              <button class="btn btn-primary" onclick="Modal.close()" style="width:100%;">
                <i data-lucide="check" style="width:16px;height:16px;"></i> Done
              </button>
            </div>
          `,
          maxWidth: '460px'
        });

        if (window.StudentsPage) StudentsPage.loadStudents();
        if (window.HostelStructurePage) HostelStructurePage.loadStructure();
        if (window.AdminDashboard && App.currentRoute === 'dashboard') AdminDashboard.loadData();
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
