import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { navLinks } from '../constants/index';
import { logo, menu, close, download } from '../assets';
import resume from "../assets/gokulJana_resume.pdf"

const Navbar = () => {
  const [active, setActive] = useState();
  const [toggle, setToggle] = useState(false)

  const downloadResume = () => {
    const fileName = 'gokulJana_resume.pdf';

    // Create an anchor element and simulate a click to trigger the download
    const link = document.createElement('a');
    link.href = resume;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <nav className={`${styles.paddingX} w-full flex item-center py-5 fixed top-0 z-20 bg-primary`}>
      <div className='w-full flex justify-between item-center max-w-7xl mx-auto'>
        <Link to='/' className='flex item-center gap-2'
          onClick={() => {
            setActive('');
            window.scrollTo(0, 0)
          }}>
          <img src={logo} className='w-9 h-9 object-contain' alt='logo' />
          <p className='text-white text-base md:text-lg font-bold cursor-pointer flex items-center '>Gokul &nbsp; <span className='sm:block hidden' > Jana</span></p>
        </Link>
        <ul className='list-name hidden sm:flex flex-row gap-10 sm:items-center '>
          {navLinks.map((link) => (

            <li key={link.id} onClick={() => {
              setActive(link.title)
              if (link.id === "cv") {
                downloadResume()
              }
            }}
              className={`${active === link.title ? 'text-white' : 'text-secondary'} hover:text-white text-[15px] md:text-lg font-medium cursor-pointer`}>
              <a href={`#${link.id}`}>{link.icon ? <span className='flex items-center h-full '><img src={link.icon} alt={link.icon} />{link.title}</span> : link.title}</a>
            </li>))
          }
        </ul>
        <div className='sm:hidden flex flex-1 justify-end items-center '>
          <span className='flex items-center mr-4 ' onClick={() => downloadResume()}><img src={navLinks[0].icon} alt={navLinks[0].icon} />{navLinks[0].title}</span>

          <img src={toggle ? close : menu} onClick={() => setToggle(!toggle)}
            alt='menu' className='w-[28px] h-[28px] object-contain cursor-pointer ' />

          <div className={`${!toggle ? 'hidden' : 'flex'} p-6 black-gradient absolute top-20 right-0 mx-4 my-2 m-w-[140px] z-10 rounded-xl `}>
            <ul className='list-name flex justify-end items-start flex-col gap-4 '>
              {navLinks.map((link) => (

                <li key={link.id} onClick={() => {
                  setToggle(!toggle);
                  setActive(link.title)
                  if (link.id === "cv") {
                    downloadResume()
                  }
                }}
                  className={`${active === link.title ? 'text-white' : 'text-secondary'}font-poppins font-medium text-[16px]  cursor-pointer`}>
                  <a href={`#${link.id}`}>{link.icon ? <span className='flex items-center '><img src={link.icon} alt={link.icon} />{link.title}</span> : link.title}</a>
                </li>))
              }
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar