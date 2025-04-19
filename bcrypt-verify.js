import * as bcrypt from 'bcrypt';

// The hash from your SQL script
const storedHash = '$2b$10$4RvKP.XnDuIToZxjDxL1yOWB7mol8bsJCVkza5umQtvloGR6OAjQy';

// The password you think it should match
const password = 'admin123';

// Verify the password against the hash
bcrypt.compare(password, storedHash, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
    return;
  }
  
  if (result) {
    console.log('✅ Password verification SUCCESSFUL!');
    console.log(`The hash does match the password "${password}"`);
  } else {
    console.log('❌ Password verification FAILED!');
    console.log(`The hash does NOT match the password "${password}"`);
    
    // Generate a new hash for the password for comparison
    bcrypt.hash(password, 10, (err, newHash) => {
      if (err) {
        console.error('Error generating new hash:', err);
        return;
      }
      console.log('\nFor reference, a new hash for the password would be:');
      console.log(newHash);
    });
  }
});

// Let's also generate a hash we know is correct for this password
console.log('\nGenerating a new hash for "admin123" that you can use:');
bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('New hash for "admin123":', hash);
  console.log('\nYou can replace the hash in your SQL with this one if needed.');
});