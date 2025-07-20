import styles from './Signup.module.css';
import React from 'react';
import { useState } from 'react';
import { useSignup } from '../../hooks/useSignup';
import { useSchools } from '../../hooks/useSchools';
import Select from 'react-select';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [county, setCounty] = useState(null);
  const [school, setSchool] = useState(null); // Changed to null for Select component
  const [validationError, setValidationError] = useState(null);

  const { signup, error, isPending } = useSignup();
  const { schools, isLoading: schoolsLoading, error: schoolsError } = useSchools(county);

  const countyOptions = [
    { value: 'antrim', label: 'Antrim' },
    { value: 'armagh', label: 'Armagh' },
    { value: 'carlow', label: 'Carlow' },
    { value: 'cavan', label: 'Cavan' },
    { value: 'clare', label: 'Clare' },
    { value: 'cork', label: 'Cork' },
    { value: 'derry', label: 'Derry' },
    { value: 'donegal', label: 'Donegal' },
    { value: 'down', label: 'Down' },
    { value: 'dublin', label: 'Dublin' },
    { value: 'fermanagh', label: 'Fermanagh' },
    { value: 'galway', label: 'Galway' },
    { value: 'kerry', label: 'Kerry' },
    { value: 'kildare', label: 'Kildare' },
    { value: 'kilkenny', label: 'Kilkenny' },
    { value: 'laois', label: 'Laois' },
    { value: 'leitrim', label: 'Leitrim' },
    { value: 'limerick', label: 'Limerick' },
    { value: 'longford', label: 'Longford' },
    { value: 'louth', label: 'Louth' },
    { value: 'mayo', label: 'Mayo' },
    { value: 'meath', label: 'Meath' },
    { value: 'monaghan', label: 'Monaghan' },
    { value: 'offaly', label: 'Offaly' },
    { value: 'roscommon', label: 'Roscommon' },
    { value: 'sligo', label: 'Sligo' },
    { value: 'tipperary', label: 'Tipperary' },
    { value: 'tyrone', label: 'Tyrone' },
    { value: 'waterford', label: 'Waterford' },
    { value: 'westmeath', label: 'Westmeath' },
    { value: 'wexford', label: 'Wexford' },
    { value: 'wicklow', label: 'Wicklow' },
  ];

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      fontSize: '1em',
      color: '#777',
      borderRadius: '10px',
      backgroundColor: '#f3f2e6',
      border: '2px solid #555',
      boxShadow: 'none',
      minHeight: '0px',
      '&:hover': {
        border: '2px solid #555',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#777',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#777',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '10px',
      border: '2px solid #555',
      backgroundColor: '#4b6737',
      maxHeight: '200px',
      overflowY: 'auto',
      width: '70%',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isHovered ? '#f3f2e6' : '#4b6737',
      color: 'white',
      fontFamily: "'Bitter', serif",
    }),
  };

  // Handle county change and reset school selection
  const handleCountyChange = (selectedCounty) => {
    setCounty(selectedCounty.value);
    setSchool(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email !== confirmEmail || confirmEmail == '') {
      setValidationError("There's an issue with your email!");
      return;
    }

    if (password !== confirmPassword || confirmPassword == '') {
      setValidationError("There's an issue with your password!");
      return;
    }

    if (!county) {
      setValidationError('Please select a county!');
      return;
    }

    if (!school) {
      setValidationError('Please select a school!');
      return;
    }

    setValidationError(null);
    signup(email, password, schools[0].value, county);
  };

  return (
    <div className={styles['signup-form-container']}>
      <form onSubmit={handleSubmit} className={styles['signup-form']}>
        <div className={styles['signup-form-contents']}>
          <h2>Create your account</h2>
          <div className={styles['signup50-50']}>
            <div className={styles['signup50-50-left']}>
              <label>
                <span>Select County</span>
                <Select
                  options={countyOptions}
                  value={countyOptions.find((option) => option.value === county)} // Find the full object
                  onChange={handleCountyChange}
                  placeholder="Choose a county..."
                  isSearchable
                  styles={customStyles}
                  className={styles['react-select-container']}
                  classNamePrefix="react-select"
                />
              </label>
              <label>
                <span>Select School</span>
                <Select
                  options={schools}
                  value={school}
                  onChange={setSchool}
                  placeholder={
                    county ? (schoolsLoading ? 'Loading schools...' : 'Choose a school...') : 'Select county first'
                  }
                  isSearchable
                  isDisabled={!county || schoolsLoading}
                  isLoading={schoolsLoading}
                  styles={customStyles}
                  className={styles['react-select-container']}
                  classNamePrefix="react-select"
                  noOptionsMessage={() =>
                    county ? 'No schools found for this county' : 'Please select a county first'
                  }
                />
                {schoolsError && <span style={{ color: 'red', fontSize: '0.8em' }}>Error loading schools</span>}
              </label>
            </div>
            <div className={styles['signup50-50-right']}>
              <label>
                <span>Email</span>
                <input type="email" onChange={(e) => setEmail(e.target.value)} value={email} />
              </label>

              <label>
                <span>Confirm Email</span>
                <input type="email" onChange={(e) => setConfirmEmail(e.target.value)} value={confirmEmail} />
              </label>

              <label>
                <span>Password</span>
                <input type="password" onChange={(e) => setPassword(e.target.value)} value={password} />
              </label>

              <label>
                <span>Confirm Password</span>
                <input type="password" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} />
              </label>
            </div>
          </div>
          {!isPending && <button className="btn">Sign up</button>}
          {isPending && (
            <button className="btn" disabled>
              Loading
            </button>
          )}
          {error && <div className={styles.err}>{error}</div>}
          {validationError && <div className={styles.err}>{validationError}</div>}
        </div>
      </form>
    </div>
  );
}
